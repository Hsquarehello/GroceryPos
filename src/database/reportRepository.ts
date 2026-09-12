import db from "./db";
import { formatLocalDate } from "./helpers";

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

export interface QuantitySoldItem {
  product_id: number;
  product_name: string;
  selling_unit: "unit" | "kg" | "g" | "viss" | "tcl";
  quantity: number;
  sale_count: number;
  revenue: number;
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
      } else if (lineItem.selling_unit === "unit") {
        metrics.totalItems += lineItem.quantity;
      }
      return metrics;
    },
    { totalItems: 0, totalWeightTcl: 0 },
  );
}

export async function getDateRangeReport(
  startDate = new Date(),
  endDate = startDate,
): Promise<DailyReport> {
  const start = formatLocalDate(startDate);
  const end = formatLocalDate(endDate);
  const row = await db.getFirstAsync<DailyReport>(
    `SELECT
       COALESCE((SELECT SUM(total_amount) FROM sales WHERE status = 'COMPLETED' AND date(created_at, 'localtime') BETWEEN ? AND ?), 0) AS revenue,
       COALESCE((SELECT SUM(discount_amount) FROM sales WHERE status = 'COMPLETED' AND date(created_at, 'localtime') BETWEEN ? AND ?), 0) AS discount_total,
       COALESCE((SELECT SUM(CASE WHEN payment_type = 'CASH' THEN total_amount ELSE cash_received END) FROM sales WHERE status = 'COMPLETED' AND date(created_at, 'localtime') BETWEEN ? AND ?), 0) AS net_collected,
       COALESCE((SELECT SUM(CASE WHEN payment_type = 'CREDIT' THEN total_amount - cash_received ELSE 0 END) FROM sales WHERE status = 'COMPLETED' AND date(created_at, 'localtime') BETWEEN ? AND ?), 0) AS credit_outstanding,
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
     WHERE s.status = 'COMPLETED'
       AND date(s.created_at, 'localtime') BETWEEN ? AND ?`,
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

export async function getQuantitySoldByDateRange(
  startDate = new Date(),
  endDate = new Date(),
): Promise<QuantitySoldItem[]> {
  const start = formatLocalDate(startDate);
  const end = formatLocalDate(endDate);

  return db.getAllAsync<QuantitySoldItem>(
    `SELECT si.product_id, p.name AS product_name, p.selling_unit, SUM(si.quantity) AS quantity, COUNT(DISTINCT si.sale_id) AS sale_count, SUM(si.quantity * si.unit_price) AS revenue
     FROM sale_items si
     INNER JOIN sales s ON s.id = si.sale_id
     INNER JOIN products p ON p.id = si.product_id
     WHERE s.status = 'COMPLETED' AND date(s.created_at, 'localtime') BETWEEN ? AND ?
     GROUP BY si.product_id, p.name, p.selling_unit
     ORDER BY revenue DESC, p.name COLLATE NOCASE ASC`,
    [start, end],
  );
}

export async function getDailyQuantitySold(
  date = new Date(),
): Promise<QuantitySoldItem[]> {
  return getQuantitySoldByDateRange(date, date);
}