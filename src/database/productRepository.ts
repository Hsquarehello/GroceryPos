import db from "./db";
import { isUniqueConstraint } from "./helpers";
import { Product } from "../types";

export type ProductInput = Omit<
  Product,
  "id" | "base_stock_qty" | "created_at"
>;

export type StockProduct = {
  parent_id: number | null;
  conversion_rate: number;
  is_base_unit: number;
};

export type ProductBatch = {
  id: number;
  product_id: number;
  batch_number: string | null;
  received_qty: number;
  remaining_qty: number;
  cost_price: number;
  received_at: string;
};

const duplicateBarcodeMessage = "A product with this barcode already exists.";

const productSelect = `
  SELECT p.id, p.barcode, p.name, p.cost_price, p.selling_price,
  p.selling_unit, p.stock_qty, p.parent_id, p.conversion_rate, p.is_base_unit,
  CASE WHEN p.is_base_unit = 1 THEN p.stock_qty ELSE COALESCE(base.stock_qty, 0) END AS base_stock_qty
  FROM products p LEFT JOIN products base ON base.id = p.parent_id
`;

export function getDisplayStock(
  product: Product,
  baseStockQty = product.stock_qty,
): number {
  return product.is_base_unit
    ? baseStockQty
    : Math.floor(baseStockQty / Math.max(1, product.conversion_rate));
}

export function getBaseUnits(quantity: number, product: StockProduct): number {
  return product.is_base_unit ? quantity : quantity * product.conversion_rate;
}

function normalizeProduct(
  row: Product & { base_stock_qty?: number; is_base_unit: number | boolean },
): Product {
  const baseStockQty = row.base_stock_qty ?? row.stock_qty;
  return {
    ...row,
    is_base_unit: Boolean(row.is_base_unit),
    stock_qty: getDisplayStock(row, baseStockQty),
    base_stock_qty: baseStockQty,
  };
}

function prepareProduct(product: ProductInput) {
  const barcode = product.barcode?.trim() || null;
  const conversionRate = product.is_base_unit ? 1 : product.conversion_rate;

  if (!product.is_base_unit && (!product.parent_id || conversionRate <= 1)) {
    throw new Error(
      "Package product များအတွက် Base Product နှင့် Conversion Rate (1 ထက်ကြီးသော ပမာဏ) ထည့်သွင်းပေးရန် လိုအပ်ပါသည်။",
    );
  }

  return {
    ...product,
    barcode,
    sellingUnit: product.is_base_unit ? product.selling_unit : "unit",
    conversionRate,
    stockQty: product.is_base_unit ? product.stock_qty : 0,
  };
}

export async function getProducts(search = ""): Promise<Product[]> {
  const term = `%${search.trim()}%`;
  const rows = await db.getAllAsync<
    Product & { base_stock_qty: number; is_base_unit: number }
  >(
    `${productSelect} WHERE p.name LIKE ? OR COALESCE(p.barcode, '') LIKE ? ORDER BY p.name COLLATE NOCASE ASC`,
    [term, term],
  );
  return rows.map(normalizeProduct);
}

export async function getBaseProducts(): Promise<Product[]> {
  const rows = await db.getAllAsync<
    Product & { base_stock_qty: number; is_base_unit: number }
  >(
    `${productSelect} WHERE p.is_base_unit = 1 ORDER BY p.name COLLATE NOCASE ASC`,
  );
  return rows.map(normalizeProduct);
}

export async function getProductById(id: number): Promise<Product | null> {
  const row = await db.getFirstAsync<
    Product & { base_stock_qty: number; is_base_unit: number }
  >(`${productSelect} WHERE p.id = ?`, [id]);
  return row ? normalizeProduct(row) : null;
}

export async function getProductByBarcode(
  barcode: string,
): Promise<Product | null> {
  const value = barcode.trim();
  if (!value) return null;
  const row = await db.getFirstAsync<
    Product & { base_stock_qty: number; is_base_unit: number }
  >(`${productSelect} WHERE p.barcode = ?`, [value]);
  return row ? normalizeProduct(row) : null;
}

export async function createProduct(product: ProductInput): Promise<number> {
  const prepared = prepareProduct(product);
  try {
    // Stock is tracked through product_batches. Insert the product with 0 stock,
    // then addProductBatch below adds the opening stock without doubling it.
    const result = await db.runAsync(
      `INSERT INTO products (barcode, name, selling_unit, cost_price, selling_price, stock_qty, parent_id, conversion_rate, is_base_unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        prepared.barcode,
        prepared.name.trim(),
        prepared.sellingUnit,
        prepared.cost_price,
        prepared.selling_price,
        0,
        prepared.parent_id,
        prepared.conversionRate,
        prepared.is_base_unit ? 1 : 0,
      ],
    );
    if (prepared.is_base_unit && prepared.stockQty > 0) {
      await addProductBatch(
        result.lastInsertRowId,
        prepared.stockQty,
        prepared.cost_price,
        "OPENING",
      );
    }
    return result.lastInsertRowId;
  } catch (error) {
    if (isUniqueConstraint(error)) throw new Error(duplicateBarcodeMessage);
    throw error;
  }
}

export async function addStockFromPackage(
  productId: number,
  addedQty: number,
): Promise<void> {
  if (addedQty <= 0) return;
  await addProductBatch(productId, addedQty, 0, "OPENING");
}

export async function addProductBatch(
  productId: number,
  quantity: number,
  costPrice: number,
  batchNumber = "",
): Promise<number> {
  if (quantity <= 0)
    throw new Error("Restock quantity must be greater than zero.");

  let batchId = 0;
  await db.withExclusiveTransactionAsync(async (transaction) => {
    const product = await transaction.getFirstAsync<{
      id: number;
      cost_price: number;
      is_base_unit: number;
      parent_id: number | null;
      conversion_rate: number;
    }>(
      "SELECT id, cost_price, is_base_unit, parent_id, conversion_rate FROM products WHERE id = ?",
      [productId],
    );
    if (!product) throw new Error("Product was not found.");

    // Batches are always stored at the base product level (FIFO is consumed there).
    // A package product restock is converted into base units.
    // origin_product_id keeps the package product that was actually restocked.
    let batchProductId = productId;
    let originProductId: number | null = null;
    let batchQty = quantity;
    let batchCost = costPrice;
    if (!product.is_base_unit) {
      if (!product.parent_id || product.conversion_rate <= 1) {
        throw new Error(
          "Package product များအတွက် Base Product နှင့် Conversion Rate မမှန်ကန်ပါ။",
        );
      }
      batchProductId = product.parent_id;
      originProductId = productId;
      batchQty = quantity * product.conversion_rate;
      batchCost = costPrice > 0 ? costPrice / product.conversion_rate : 0;
    }

    const baseProduct = await transaction.getFirstAsync<{
      cost_price: number;
    }>("SELECT cost_price FROM products WHERE id = ?", [batchProductId]);
    if (!baseProduct) throw new Error("Base product was not found.");

    const effectiveCost = batchCost > 0 ? batchCost : baseProduct.cost_price;
    const batch = await transaction.runAsync(
      "INSERT INTO product_batches (product_id, batch_number, received_qty, remaining_qty, cost_price, origin_product_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        batchProductId,
        batchNumber.trim() || null,
        batchQty,
        batchQty,
        effectiveCost,
        originProductId,
      ],
    );
    batchId = batch.lastInsertRowId;
    await transaction.runAsync(
      "UPDATE products SET stock_qty = stock_qty + ?, cost_price = ? WHERE id = ?",
      [batchQty, effectiveCost, batchProductId],
    );
  });
  return batchId;
}

export async function getProductBatches(
  productId: number,
): Promise<ProductBatch[]> {
  return db.getAllAsync<ProductBatch>(
    "SELECT id, product_id, batch_number, received_qty, remaining_qty, cost_price, received_at FROM product_batches WHERE product_id = ? ORDER BY received_at ASC, id ASC",
    [productId],
  );
}

export type PurchaseBatchEntry = {
  id: number;
  product_id: number;
  product_name: string;
  selling_unit: "unit" | "kg" | "g" | "ပိဿာ" | "ကျပ်သား";
  batch_number: string | null;
  received_qty: number;
  remaining_qty: number;
  cost_price: number;
  received_at: string;
  origin_product_id: number | null;
  origin_product_name: string | null;
  is_base_unit: boolean;
  conversion_rate: number;
  base_received_qty: number;
  base_remaining_qty: number;
  base_cost_price: number;
  base_product_name: string;
  selling_unit_base: "unit" | "kg" | "g" | "ပိဿာ" | "ကျပ်သား";
};

export type PurchaseBatchPage = {
  batches: PurchaseBatchEntry[];
  hasMore: boolean;
};

export async function getPurchaseBatches(
  limit = 10,
  offset = 0,
): Promise<PurchaseBatchPage> {
  // Batch data is stored at the base product level (FIFO). When a package
  // product was restocked (origin_product_id), display the package product
  // with quantities converted back into package units.
  const rows = await db.getAllAsync<
    Omit<PurchaseBatchEntry, "is_base_unit"> & {
      is_base_unit: number;
      origin_conversion_rate: number;
    }
  >(
    `SELECT b.id, b.product_id, p.name AS product_name, p.selling_unit,
            b.batch_number, b.received_qty, b.remaining_qty, b.cost_price,
            b.received_at, b.origin_product_id,
            origin.name AS origin_product_name,
            origin.conversion_rate AS origin_conversion_rate,
            p.is_base_unit, p.conversion_rate
     FROM product_batches b
     INNER JOIN products p ON p.id = b.product_id
     LEFT JOIN products origin ON origin.id = b.origin_product_id
     ORDER BY b.received_at DESC, b.id DESC
     LIMIT ? OFFSET ?`,
    [limit + 1, offset],
  );

  const batches = rows.slice(0, limit).map((row) => {
    const isPackage = Boolean(row.origin_product_id);
    // Use the ORIGIN (package) product's conversion rate — the base product's
    // rate is always 1 and cannot convert base units back into packages.
    const rate = isPackage ? Math.max(1, row.origin_conversion_rate) : 1;
    return {
      ...row,
      is_base_unit: Boolean(row.is_base_unit),
      product_id: isPackage ? row.origin_product_id! : row.product_id,
      product_name: isPackage
        ? row.origin_product_name ?? row.product_name
        : row.product_name,
      received_qty: isPackage
        ? Math.round((row.received_qty / rate) * 1000) / 1000
        : row.received_qty,
      remaining_qty: isPackage
        ? Math.round((row.remaining_qty / rate) * 1000) / 1000
        : row.remaining_qty,
      cost_price: isPackage ? row.cost_price * rate : row.cost_price,
      base_received_qty: row.received_qty,
      base_remaining_qty: row.remaining_qty,
      base_cost_price: row.cost_price,
      base_product_name: row.product_name,
      selling_unit_base: row.selling_unit,
    };
  });

  return {
    batches,
    hasMore: rows.length > limit,
  };
}

export async function updateProduct(
  id: number,
  product: ProductInput,
): Promise<void> {
  const prepared = prepareProduct(product);
  try {
    if (prepared.is_base_unit) {
      await db.runAsync(
        `UPDATE products SET barcode = ?, name = ?, selling_unit = ?, cost_price = ?, selling_price = ?, stock_qty = ?, parent_id = ?, conversion_rate = ?, is_base_unit = ? WHERE id = ?`,
        [
          prepared.barcode,
          prepared.name.trim(),
          prepared.sellingUnit,
          prepared.cost_price,
          prepared.selling_price,
          prepared.stockQty,
          prepared.parent_id,
          prepared.conversionRate,
          1,
          id,
        ],
      );
    } else {
      await db.runAsync(
        `UPDATE products SET barcode = ?, name = ?, selling_unit = ?, cost_price = ?, selling_price = ?, parent_id = ?, conversion_rate = ?, is_base_unit = ? WHERE id = ?`,
        [
          prepared.barcode,
          prepared.name.trim(),
          prepared.sellingUnit,
          prepared.cost_price,
          prepared.selling_price,
          prepared.parent_id,
          prepared.conversionRate,
          0,
          id,
        ],
      );
    }
  } catch (error) {
    if (isUniqueConstraint(error)) throw new Error(duplicateBarcodeMessage);
    throw error;
  }
}

export async function updateProductDetails(
  id: number,
  details: Pick<Product, "barcode" | "name" | "selling_price">,
): Promise<void> {
  try {
    await db.runAsync(
      "UPDATE products SET barcode = ?, name = ?, selling_price = ? WHERE id = ?",
      [
        details.barcode?.trim() || null,
        details.name.trim(),
        details.selling_price,
        id,
      ],
    );
  } catch (error) {
    if (isUniqueConstraint(error)) throw new Error(duplicateBarcodeMessage);
    throw error;
  }
}

export async function updatePackageStock(
  packageProduct: ProductInput,
  targetPackageQty: number,
): Promise<void> {
  if (!packageProduct.parent_id || !packageProduct.conversion_rate) return;

  const parent = await getProductById(packageProduct.parent_id);
  if (!parent) return;

  const currentBaseStock = parent.base_stock_qty ?? parent.stock_qty;
  const rate = packageProduct.conversion_rate;
  const remainderBaseQty = currentBaseStock % rate;
  const newBaseStockQty = targetPackageQty * rate + remainderBaseQty;

  await updateProduct(parent.id!, {
    ...parent,
    stock_qty: newBaseStockQty,
  });
}

export async function deleteProduct(id: number): Promise<void> {
  await db.runAsync("DELETE FROM products WHERE id = ?", [id]);
}
