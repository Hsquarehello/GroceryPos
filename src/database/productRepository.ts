import db from "./db";
import { CartItem, Customer, Product, Sale } from "../types";

export type ProductInput = Omit<
  Product,
  "id" | "base_stock_qty" | "created_at"
>;

const duplicateBarcodeMessage = "A product with this barcode already exists.";

function isUniqueConstraint(error: unknown) {
  return (
    error instanceof Error && error.message.toLowerCase().includes("unique")
  );
}

export function getDisplayStock(
  product: Product,
  baseStockQty = product.stock_qty,
) {
  return product.is_base_unit
    ? baseStockQty
    : Math.floor(baseStockQty / Math.max(1, product.conversion_rate));
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
    // Package ဖြစ်ပါက stock_qty ကို 0 ဟုသာ သတ်မှတ်မည် (Base Item တွင်သာ Stock ရှိမည်)
    stockQty: product.is_base_unit ? product.stock_qty : 0,
  };
}

const productSelect = `
  SELECT p.id, p.barcode, p.name, p.cost_price, p.selling_price,
  p.selling_unit, p.stock_qty, p.parent_id, p.conversion_rate, p.is_base_unit,
  CASE WHEN p.is_base_unit = 1 THEN p.stock_qty ELSE COALESCE(base.stock_qty, 0) END AS base_stock_qty
  FROM products p LEFT JOIN products base ON base.id = p.parent_id
`;

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

/**
 * Package သို့မဟုတ် Base Product တွဲဖက်၍ Stock ဖြည့်သွင်းခြင်း
 * @param productId Product ID
 * @param addedQty ဖြည့်သွင်းမည့် အရေအတွက် (Package ဖြစ်ပါက အထုပ်ကြီး အရေအတွက်)
 */
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
    // Package အထုပ်ကြီးဖြစ်ပါက (ဥပမာ- အထုပ်ကြီး 2 ထုပ်ဝင်လာရင် 2 x 30 = 60 ထုပ်ကို Base Product ထဲ ပေါင်းမည်)
    const totalBaseQtyToAdd = addedQty * product.conversion_rate;
    await db.runAsync(
      "UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?", // ရောထွေးမှုမရှိစေရန် Base ID ထဲ ပေါင်းမည်
      [totalBaseQtyToAdd, product.parent_id],
    );
  } else {
    // Base Product ဖြစ်ပါက မိမိ Stock ထဲ တိုက်ရိုက် ပေါင်းမည်
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
      // Base Product ဆိုရင် stock_qty ကို တိုက်ရိုက် update လုပ်ခွင့်ပေးမည်
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
      // Package Product ဆိုရင် stock_qty ကို update မလုပ်ဘဲ မူလအတိုင်း 0 ထားမည် (Base Stock မပျက်စီးစေရန်)
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

  // 1. Parent (Base) Product ကို ရယူပါ
  const parent = await getProductById(packageProduct.parent_id);
  if (!parent) return;

  const currentBaseStock = parent.base_stock_qty ?? parent.stock_qty;
  const rate = packageProduct.conversion_rate;

  // 2. Package ထဲ မပါဘဲ အကြွင်းကျန်နေသော Single Unit အရေအတွက်ကို တွက်ပါ
  const remainderBaseQty = currentBaseStock % rate;

  // 3. Package Qty အသစ်အတွက် လိုအပ်မည့် Base Stock Qty စုစုပေါင်းကို တွက်ပါ
  const newBaseStockQty = targetPackageQty * rate + remainderBaseQty;

  // 4. Base Product ၏ Stock ကို Update သွားလုပ်ပါ
  await updateProduct(parent.id!, {
    ...parent,
    stock_qty: newBaseStockQty,
  });
}

export async function deleteProduct(id: number): Promise<void> {
  await db.runAsync("DELETE FROM products WHERE id = ?", [id]);
}

export interface DailyReport {
  revenue: number;
  discount_total: number;
  net_collected: number;
  credit_outstanding: number;
  cogs: number;
  profit: number;
  transaction_count: number;
  total_items: number;
  total_weight_tcl: number;
}

export interface QuantityLineItem {
  quantity: number;
  selling_unit: "unit" | "kg" | "g" | "viss" | "tcl";
}

export interface QuantityMetrics {
  totalItems: number;
  totalWeightTcl: number;
}

export function toTcl(
  quantity: number,
  unit: QuantityLineItem["selling_unit"],
): number {
  if (unit === "viss") return quantity * 100;
  if (unit === "tcl") return quantity;
  return 0;
}

export function calculateQuantityMetrics(
  lineItems: QuantityLineItem[],
): QuantityMetrics {
  return lineItems.reduce(
    (metrics, lineItem) => {
      if (lineItem.selling_unit === "viss" || lineItem.selling_unit === "tcl") {
        metrics.totalWeightTcl += toTcl(
          lineItem.quantity,
          lineItem.selling_unit,
        );
      } else {
        if (lineItem.selling_unit === "unit") {
          metrics.totalItems += lineItem.quantity;
        }
      }
      return metrics;
    },
    { totalItems: 0, totalWeightTcl: 0 },
  );
}

export interface TransactionSummary {
  id: number;
  total_amount: number;
  discount_amount: number;
  cash_received: number;
  change_amount: number;
  payment_type: "CASH" | "CREDIT";
  customer_name: string | null;
  customer_phone: string | null;
  sale_note: string | null;
  debt_note: string | null;
  created_at: string;
  item_count: number;
}

export interface TransactionDetailItem {
  id: number;
  product_name: string;
  selling_unit: QuantityLineItem["selling_unit"];
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface TransactionDetail extends TransactionSummary {
  items: TransactionDetailItem[];
}

export interface TransactionPage {
  transactions: TransactionSummary[];
  hasMore: boolean;
}

export interface CustomerDebtSale {
  id: number;
  total_amount: number;
  cash_received: number;
  remaining_amount: number;
  created_at: string;
  debt_note: string | null;
  sale_note: string | null;
}

export interface CustomerDebtRepayment {
  id: number;
  amount_paid: number;
  created_at: string;
}

export interface CustomerDebtDetail {
  customer_id: number;
  name: string;
  phone: string | null;
  total_debt: number;
  sales: CustomerDebtSale[];
  repayments: CustomerDebtRepayment[];
}

export interface QuantitySoldItem {
  product_id: number;
  product_name: string;
  selling_unit: "unit" | "kg" | "g" | "viss" | "tcl";
  quantity: number;
  sale_count: number;
  revenue: number;
}

function formatLocalDate(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) =>
      index === 0 ? String(part) : String(part).padStart(2, "0"),
    )
    .join("-");
}

export async function getDateRangeReport(
  startDate = new Date(),
  endDate = startDate,
): Promise<DailyReport> {
  const start = formatLocalDate(startDate);
  const end = formatLocalDate(endDate);
  const row = await db.getFirstAsync<DailyReport>(
    `SELECT
       COALESCE((SELECT SUM(total_amount) FROM sales WHERE date(created_at, 'localtime') BETWEEN ? AND ?), 0) AS revenue,
       COALESCE((SELECT SUM(discount_amount) FROM sales WHERE date(created_at, 'localtime') BETWEEN ? AND ?), 0) AS discount_total,
       COALESCE((SELECT SUM(CASE WHEN payment_type = 'CASH' THEN total_amount ELSE cash_received END) FROM sales WHERE date(created_at, 'localtime') BETWEEN ? AND ?), 0) AS net_collected,
       COALESCE((SELECT SUM(CASE WHEN payment_type = 'CREDIT' THEN total_amount - cash_received ELSE 0 END) FROM sales WHERE date(created_at, 'localtime') BETWEEN ? AND ?), 0) AS credit_outstanding,
       COALESCE(SUM(si.quantity * COALESCE(NULLIF(si.unit_cost, 0), p.cost_price)), 0) AS cogs,
       COALESCE(SUM(si.quantity * (si.unit_price - COALESCE(NULLIF(si.unit_cost, 0), p.cost_price))), 0) AS profit,
       COUNT(DISTINCT s.id) AS transaction_count,
       COALESCE(SUM(CASE WHEN p.selling_unit NOT IN ('kg', 'g', 'viss', 'tcl') THEN si.quantity ELSE 0 END), 0) AS total_items,
       COALESCE(SUM(CASE
         WHEN p.selling_unit = 'viss' THEN si.quantity * 100
         WHEN p.selling_unit = 'tcl' THEN si.quantity
         ELSE 0
       END), 0) AS total_weight_tcl
     FROM sales s
     LEFT JOIN sale_items si ON si.sale_id = s.id
     LEFT JOIN products p ON p.id = si.product_id
    WHERE date(s.created_at, 'localtime') BETWEEN ? AND ?`,
    [start, end, start, end, start, end, start, end, start, end],
  );

  return {
    revenue: Number(row?.revenue ?? 0),
    discount_total: Number(row?.discount_total ?? 0),
    net_collected: Number(row?.net_collected ?? 0),
    credit_outstanding: Number(row?.credit_outstanding ?? 0),
    cogs: Number(row?.cogs ?? 0),
    profit: Number(row?.profit ?? 0),
    transaction_count: Number(row?.transaction_count ?? 0),
    total_items: Number(row?.total_items ?? 0),
    total_weight_tcl: Number(row?.total_weight_tcl ?? 0),
  };
}

export async function getDailyReport(date = new Date()): Promise<DailyReport> {
  return getDateRangeReport(date);
}

export async function getDailyTransactions(
  date = new Date(),
  limit = 10,
  offset = 0,
): Promise<TransactionPage> {
  return getTransactionsByDateRange(date, date, limit, offset);
}

export async function getTransactionsByDateRange(
  startDate = new Date(),
  endDate = new Date(),
  limit = 10,
  offset = 0,
): Promise<TransactionPage> {
  const start = formatLocalDate(startDate);
  const end = formatLocalDate(endDate);

  const rows = await db.getAllAsync<TransactionSummary>(
    `SELECT
       s.id,
       s.total_amount,
         s.discount_amount,
       s.cash_received,
       s.change_amount,
       s.payment_type,
       c.name AS customer_name,
         c.phone AS customer_phone,
         s.sale_note,
         s.debt_note,
       s.created_at,
       COUNT(si.id) AS item_count
     FROM sales s
     LEFT JOIN customers c ON c.id = s.customer_id
     LEFT JOIN sale_items si ON si.sale_id = s.id
     WHERE date(s.created_at, 'localtime') BETWEEN ? AND ?
     GROUP BY s.id
     ORDER BY s.created_at DESC, s.id DESC
     LIMIT ? OFFSET ?`,
    [start, end, limit + 1, offset],
  );

  return {
    transactions: rows.slice(0, limit),
    hasMore: rows.length > limit,
  };
}

export async function getTransactionDetail(
  transactionId: number,
): Promise<TransactionDetail | null> {
  const transaction = await db.getFirstAsync<TransactionSummary>(
    `SELECT
       s.id,
       s.total_amount,
       s.discount_amount,
       s.cash_received,
       s.change_amount,
       s.payment_type,
       c.name AS customer_name,
       c.phone AS customer_phone,
       s.sale_note,
       s.debt_note,
       s.created_at,
       COUNT(si.id) AS item_count
     FROM sales s
     LEFT JOIN customers c ON c.id = s.customer_id
     LEFT JOIN sale_items si ON si.sale_id = s.id
     WHERE s.id = ?
     GROUP BY s.id`,
    [transactionId],
  );

  if (!transaction) return null;

  const items = await db.getAllAsync<TransactionDetailItem>(
    `SELECT
       si.id,
       p.name AS product_name,
       p.selling_unit,
       si.quantity,
       si.unit_price,
       si.quantity * si.unit_price AS line_total
     FROM sale_items si
     INNER JOIN products p ON p.id = si.product_id
     WHERE si.sale_id = ?
     ORDER BY si.id ASC`,
    [transactionId],
  );

  return { ...transaction, items };
}

export async function getDailyQuantitySold(
  date = new Date(),
): Promise<QuantitySoldItem[]> {
  return getQuantitySoldByDateRange(date, date);
}

export async function getQuantitySoldByDateRange(
  startDate = new Date(),
  endDate = new Date(),
): Promise<QuantitySoldItem[]> {
  const start = formatLocalDate(startDate);
  const end = formatLocalDate(endDate);

  return db.getAllAsync<QuantitySoldItem>(
    `SELECT
       si.product_id,
       p.name AS product_name,
       p.selling_unit,
       SUM(si.quantity) AS quantity,
      COUNT(DISTINCT si.sale_id) AS sale_count,
      SUM(si.quantity * si.unit_price) AS revenue
     FROM sale_items si
     INNER JOIN sales s ON s.id = si.sale_id
     INNER JOIN products p ON p.id = si.product_id
     WHERE date(s.created_at, 'localtime') BETWEEN ? AND ?
     GROUP BY si.product_id, p.name, p.selling_unit
    ORDER BY revenue DESC, p.name COLLATE NOCASE ASC`,
    [start, end],
  );
}

export async function getCustomers(): Promise<Customer[]> {
  return db.getAllAsync<Customer>(
    "SELECT id, name, phone, total_debt, created_at FROM customers ORDER BY name COLLATE NOCASE ASC",
  );
}

export async function getCustomerDebtDetail(
  customerId: number,
): Promise<CustomerDebtDetail> {
  const customer = await db.getFirstAsync<Customer>(
    "SELECT id, name, phone, total_debt, created_at FROM customers WHERE id = ?",
    [customerId],
  );

  if (!customer) {
    throw new Error("Customer not found.");
  }

  const sales = await db.getAllAsync<CustomerDebtSale>(
    `SELECT
       s.id,
       s.total_amount,
       s.cash_received,
       (s.total_amount - s.cash_received) AS remaining_amount,
       s.created_at,
       s.debt_note,
       s.sale_note
     FROM sales s
     WHERE s.customer_id = ? AND s.payment_type = 'CREDIT'
     ORDER BY s.created_at DESC, s.id DESC`,
    [customerId],
  );

  const repayments = await db.getAllAsync<CustomerDebtRepayment>(
    `SELECT id, amount_paid, created_at
     FROM debt_repayments
     WHERE customer_id = ?
     ORDER BY created_at DESC, id DESC`,
    [customerId],
  );

  return {
    customer_id: customer.id!,
    name: customer.name,
    phone: customer.phone,
    total_debt: customer.total_debt,
    sales,
    repayments,
  };
}

export async function createCustomer(
  name: string,
  phone = "",
): Promise<number> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Customer name is required.");
  const result = await db.runAsync(
    "INSERT INTO customers (name, phone) VALUES (?, ?)",
    [trimmedName, phone.trim() || null],
  );
  return result.lastInsertRowId;
}

export async function updateCustomer(
  id: number,
  name: string,
  phone = "",
): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Customer name is required.");

  const result = await db.runAsync(
    "UPDATE customers SET name = ?, phone = ? WHERE id = ?",
    [trimmedName, phone.trim() || null, id],
  );

  if (result.changes !== 1) {
    throw new Error("Customer was not found.");
  }
}

export async function deleteCustomer(id: number): Promise<void> {
  const result = await db.runAsync("DELETE FROM customers WHERE id = ?", [id]);
  if (result.changes !== 1) {
    throw new Error("Customer was not found.");
  }
}

export async function repayCustomerDebt(
  customerId: number,
  amount: number,
): Promise<void> {
  if (amount <= 0)
    throw new Error("Repayment amount must be greater than zero.");

  await db.withExclusiveTransactionAsync(async (transaction) => {
    const update = await transaction.runAsync(
      "UPDATE customers SET total_debt = total_debt - ? WHERE id = ? AND total_debt >= ?",
      [amount, customerId, amount],
    );
    if (update.changes !== 1) {
      throw new Error("Repayment cannot be greater than the customer's debt.");
    }
    await transaction.runAsync(
      "INSERT INTO debt_repayments (customer_id, amount_paid) VALUES (?, ?)",
      [customerId, amount],
    );
  });
}

export async function completeSale(
  items: CartItem[],
  cashReceived: number,
  discountAmount = 0,
  paymentType: "CASH" | "CREDIT" = "CASH",
  customerId: number | null = null,
  saleNote = "",
  debtNote = "",
): Promise<Sale> {
  if (!items.length) throw new Error("Cart is empty.");

  const subtotal = items.reduce(
    (total, item) => total + item.selling_price * item.quantity,
    0,
  );
  const netTotal = Math.max(0, subtotal - discountAmount);
  if (paymentType === "CREDIT" && !customerId) {
    throw new Error("Select a customer for a credit sale.");
  }
  if (
    paymentType === "CREDIT" &&
    (cashReceived < 0 || cashReceived > netTotal)
  ) {
    throw new Error("Credit payment must be between 0 and the sale total.");
  }
  if (paymentType === "CASH" && cashReceived < netTotal) {
    throw new Error("Cash received is not enough.");
  }
  const received = cashReceived;
  const changeAmount = paymentType === "CREDIT" ? 0 : received - netTotal;
  const amountDue = paymentType === "CREDIT" ? netTotal - received : 0;
  let saleId = 0;

  await db.withExclusiveTransactionAsync(async (transaction) => {
    // 1. Sales Table ထဲ ဘေလ်အချက်အလက် သွင်းခြင်း
    const sale = await transaction.runAsync(
      "INSERT INTO sales (total_amount, discount_amount, cash_received, change_amount, payment_type, customer_id, sale_note, debt_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        netTotal,
        discountAmount,
        received,
        changeAmount,
        paymentType,
        customerId,
        saleNote.trim() || null,
        paymentType === "CREDIT" ? debtNote.trim() || null : null,
      ],
    );
    saleId = sale.lastInsertRowId;

    if (paymentType === "CREDIT") {
      const debtUpdate = await transaction.runAsync(
        "UPDATE customers SET total_debt = total_debt + ? WHERE id = ?",
        [amountDue, customerId],
      );
      if (debtUpdate.changes !== 1) throw new Error("Customer was not found.");
    }

    for (const item of items) {
      // အထုပ်ကြီး ရောင်းလျှင်လဲ Base Product ID ကိုပဲ ယူမည်
      const baseProductId = item.is_base_unit ? item.id! : item.parent_id!;

      // အထုပ်ကြီး ရောင်းပါက 1 pack x 30 = Base Units 30 နှုတ်မည်
      // အထုပ်သေး ရောင်းပါက 1 x 1 = Base Units 1 နှုတ်မည်
      const baseUnitsToDeduct = item.is_base_unit
        ? item.quantity
        : item.quantity * item.conversion_rate;

      // Base Product ၏ Stock ကိုသာ နှုတ်ယူခြင်း
      const stockUpdate = await transaction.runAsync(
        "UPDATE products SET stock_qty = stock_qty - ? WHERE id = ? AND stock_qty >= ?",
        [baseUnitsToDeduct, baseProductId, baseUnitsToDeduct],
      );

      if (stockUpdate.changes !== 1) {
        throw new Error(`"${item.name}" အတွက် လက်ကျန် Stock မလုံလောက်ပါ။`);
      }

      // Sale Items ထဲသို့ ဘေလ်စာရင်း သွင်းခြင်း
      await transaction.runAsync(
        "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, unit_cost) VALUES (?, ?, ?, ?, ?)",
        [saleId, item.id!, item.quantity, item.selling_price, item.cost_price],
      );
    }
  });

  return {
    id: saleId,
    total_amount: netTotal,
    discount_amount: discountAmount,
    cash_received: received,
    change_amount: changeAmount,
    payment_type: paymentType,
    customer_id: customerId,
    sale_note: saleNote.trim() || null,
    debt_note: paymentType === "CREDIT" ? debtNote.trim() || null : null,
  };
}
