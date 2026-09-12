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
    const result = await db.runAsync(
      `INSERT INTO products (barcode, name, selling_unit, cost_price, selling_price, stock_qty, parent_id, conversion_rate, is_base_unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        prepared.barcode,
        prepared.name.trim(),
        prepared.sellingUnit,
        prepared.cost_price,
        prepared.selling_price,
        prepared.stockQty,
        prepared.parent_id,
        prepared.conversionRate,
        prepared.is_base_unit ? 1 : 0,
      ],
    );
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

  const product = await db.getFirstAsync<{
    id: number;
    parent_id: number | null;
    conversion_rate: number;
    is_base_unit: number;
  }>(
    "SELECT id, parent_id, conversion_rate, is_base_unit FROM products WHERE id = ?",
    [productId],
  );

  if (!product) throw new Error("Product ကို ရှာမတွေ့ပါ။");

  if (
    !product.is_base_unit &&
    product.parent_id &&
    product.conversion_rate > 1
  ) {
    const totalBaseQtyToAdd = addedQty * product.conversion_rate;
    await db.runAsync(
      "UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?",
      [totalBaseQtyToAdd, product.parent_id],
    );
  } else {
    await db.runAsync(
      "UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?",
      [addedQty, productId],
    );
  }
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