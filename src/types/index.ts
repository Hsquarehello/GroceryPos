export interface Product {
  id?: number;
  barcode: string | null;
  name: string;
  selling_unit: "unit" | "kg" | "g";
  cost_price: number;
  selling_price: number;
  stock_qty: number;
  parent_id: number | null;
  conversion_rate: number;
  is_base_unit: boolean;
  base_stock_qty?: number;
  created_at?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id?: number;
  total_amount: number;
  discount_amount: number;
  cash_received: number;
  change_amount: number;
  payment_type: "CASH" | "CREDIT";
  customer_id: number | null;
  sale_note?: string | null;
  debt_note?: string | null;
  created_at?: string;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string | null;
  total_debt: number;
  created_at?: string;
}
