import db from "./db";
import { Customer } from "../types";

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

  if (!customer) throw new Error("Customer not found.");

  const sales = await db.getAllAsync<CustomerDebtSale>(
    `SELECT s.id, s.total_amount, s.cash_received, (s.total_amount - s.cash_received) AS remaining_amount, s.created_at, s.debt_note, s.sale_note
     FROM sales s
     WHERE s.customer_id = ? AND s.payment_type = 'CREDIT' AND s.status = 'COMPLETED'
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

  if (result.changes !== 1) throw new Error("Customer was not found.");
}

export async function deleteCustomer(id: number): Promise<void> {
  const result = await db.runAsync("DELETE FROM customers WHERE id = ?", [id]);
  if (result.changes !== 1) throw new Error("Customer was not found.");
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