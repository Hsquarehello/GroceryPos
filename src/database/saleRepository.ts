import db from "./db";
import { formatLocalDate } from "./helpers";
import { CartItem, Sale } from "../types";
import { getBaseUnits, StockProduct } from "./productRepository";

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
  status: "COMPLETED" | "REFUNDED";
  refunded_at: string | null;
  created_at: string;
  item_count: number;
}

export interface TransactionDetailItem {
  id: number;
  product_id: number;
  product_name: string;
  selling_unit: "unit" | "kg" | "g" | "viss" | "tcl";
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
      const baseProductId = item.is_base_unit ? item.id! : item.parent_id!;
      const baseUnitsToDeduct = item.is_base_unit
        ? item.quantity
        : item.quantity * item.conversion_rate;

      const stockUpdate = await transaction.runAsync(
        "UPDATE products SET stock_qty = stock_qty - ? WHERE id = ? AND stock_qty >= ?",
        [baseUnitsToDeduct, baseProductId, baseUnitsToDeduct],
      );

      if (stockUpdate.changes !== 1) {
        throw new Error(`"${item.name}" အတွက် လက်ကျန် Stock မလုံလောက်ပါ။`);
      }

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

export async function refundTransaction(transactionId: number): Promise<void> {
  await db.withExclusiveTransactionAsync(async (transaction) => {
    const sale = await transaction.getFirstAsync<{
      total_amount: number;
      cash_received: number;
      payment_type: "CASH" | "CREDIT";
      customer_id: number | null;
      status: "COMPLETED" | "REFUNDED";
    }>(
      "SELECT total_amount, cash_received, payment_type, customer_id, status FROM sales WHERE id = ?",
      [transactionId],
    );
    if (!sale) throw new Error("Sale was not found.");
    if (sale.status === "REFUNDED")
      throw new Error("Sale is already refunded.");

    const items = await transaction.getAllAsync<{
      product_id: number;
      quantity: number;
    }>("SELECT product_id, quantity FROM sale_items WHERE sale_id = ?", [
      transactionId,
    ]);

    for (const item of items) {
      const product = await transaction.getFirstAsync<StockProduct>(
        "SELECT parent_id, conversion_rate, is_base_unit FROM products WHERE id = ?",
        [item.product_id],
      );
      if (!product)
        throw new Error("A product from this sale no longer exists.");
      const baseProductId = product.is_base_unit
        ? item.product_id
        : product.parent_id;
      if (!baseProductId)
        throw new Error("A package product has no base product.");
      await transaction.runAsync(
        "UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?",
        [getBaseUnits(item.quantity, product), baseProductId],
      );
    }

    if (sale.payment_type === "CREDIT" && sale.customer_id) {
      await transaction.runAsync(
        "UPDATE customers SET total_debt = MAX(0, total_debt - ?) WHERE id = ?",
        [Math.max(0, sale.total_amount - sale.cash_received), sale.customer_id],
      );
    }

    await transaction.runAsync(
      "UPDATE sales SET status = 'REFUNDED', refunded_at = CURRENT_TIMESTAMP WHERE id = ?",
      [transactionId],
    );
  });
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
    `SELECT s.id, s.total_amount, s.discount_amount, s.cash_received, s.change_amount, s.payment_type, c.name AS customer_name, c.phone AS customer_phone, s.sale_note, s.debt_note, s.status, s.refunded_at, s.created_at, COUNT(si.id) AS item_count
     FROM sales s
     LEFT JOIN customers c ON c.id = s.customer_id
     LEFT JOIN sale_items si ON si.sale_id = s.id
     WHERE s.status = 'COMPLETED' AND date(s.created_at, 'localtime') BETWEEN ? AND ?
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

export async function getDailyTransactions(
  date = new Date(),
  limit = 10,
  offset = 0,
): Promise<TransactionPage> {
  return getTransactionsByDateRange(date, date, limit, offset);
}

export async function getTransactionDetail(
  transactionId: number,
): Promise<TransactionDetail | null> {
  const transaction = await db.getFirstAsync<TransactionSummary>(
    `SELECT s.id, s.total_amount, s.discount_amount, s.cash_received, s.change_amount, s.payment_type, c.name AS customer_name, c.phone AS customer_phone, s.sale_note, s.debt_note, s.status, s.refunded_at, s.created_at, COUNT(si.id) AS item_count
     FROM sales s
     LEFT JOIN customers c ON c.id = s.customer_id
     LEFT JOIN sale_items si ON si.sale_id = s.id
     WHERE s.id = ?
     GROUP BY s.id`,
    [transactionId],
  );

  if (!transaction) return null;

  const items = await db.getAllAsync<TransactionDetailItem>(
    `SELECT si.id, si.product_id, p.name AS product_name, p.selling_unit, si.quantity, si.unit_price, (si.quantity * si.unit_price) AS line_total
     FROM sale_items si
     INNER JOIN products p ON p.id = si.product_id
     WHERE si.sale_id = ?
     ORDER BY si.id ASC`,
    [transactionId],
  );

  return { ...transaction, items };
}