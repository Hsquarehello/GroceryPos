# GroceryPOS Mobile SRS

## 1. Product Overview

GroceryPOS is an offline-first mobile point-of-sale application for small grocery stores in Myanmar.

Primary goals:

- Record product inventory and sales quickly.
- Support barcode and barcode-free products.
- Support products sold by unit, kilogram, or gram.
- Support cash, full-credit, and split-payment sales.
- Track customer debt and repayments.
- Provide daily revenue, cost, and profit summaries.

## 2. Technology

- React Native with Expo SDK 57
- TypeScript
- Expo SQLite for local persistence
- Zustand for cart state
- Expo Camera for barcode scanning
- React Navigation native stack

The application does not require an internet connection for normal operation.

## 3. Product and Inventory Requirements

### F1. Product Management

- Create, edit, and delete products.
- Product names are required.
- Barcodes are optional because some products are sold manually or by weight.
- Barcodes must be unique when provided.
- Store cost price, selling price, and stock quantity as real numbers.
- Display low-stock products when available base stock is below 5.
- Support packaging products linked to a base product with a conversion rate.
- Package stock is calculated from the linked base product stock.

### F2. Selling Units

Every base product has one selling unit:

- `unit`: sold as individual items.
- `kg`: sold by kilogram.
- `g`: sold by gram.

Prices and stock are expressed in the selected selling unit. Weighted quantities may contain decimals.

Default cart quantity steps:

- `unit`: 1
- `kg`: 0.1
- `g`: 50

## 4. Checkout and Cart Requirements

### F3. Cart

- Add products from the inventory list.
- Add products by scanning a barcode.
- Adjust quantities with plus, minus, or direct entry.
- Prevent quantities from exceeding available stock.
- Calculate line totals, subtotal, discount, and net total.
- Allow an optional sale note for every sale.
- Sale notes can document reasons such as damaged or broken products receiving a discount.

### F4. Payment Types

#### Cash

- The customer pays the full net total.
- The system calculates change.
- No customer account is required.

#### Full Credit

- Paid now is `0`.
- The customer owes the full net total.

Example:

```text
Sale total: 1,500 MMK
Paid now:       0 MMK
Debt:       1,500 MMK
```

#### Split Payment

- The customer pays part of the net total immediately.
- The remaining amount is added to the customer's debt.

Formula:

$$
	ext{Debt Added} = \text{Net Sale Total} - \text{Paid Now}
$$

Example:

```text
Sale total: 1,500 MMK
Paid now:     1,000 MMK
Debt:           500 MMK
```

Credit payments must be between zero and the net sale total. A customer is required for any credit or split-payment sale.

### F5. Sale Notes

- `sale_note` is available for all sales.
- `debt_note` is available for credit and split-payment sales.
- A debt note may describe an agreed repayment date or other context.

## 5. Customer Debt Requirements

### F6. Customer Accounts

- Create customers with a required name and optional phone number.
- Display all customers and their current outstanding debt.
- Display the total outstanding debt across all customers.
- Select a customer during credit checkout.

### F7. Repayments

- Record partial or full debt repayments.
- Reject repayment amounts less than or equal to zero.
- Reject repayment amounts greater than the customer's outstanding debt.
- Decrease the customer's balance atomically.
- Store each repayment in the repayment history table.

## 6. Reports and Analytics

### F8. Daily Report

The daily report displays local-calendar-day totals for:

- Gross sale revenue.
- Net collected cash, excluding change returned to customers.
- Credit outstanding created by today's credit and split-payment sales.
- Cost of goods sold (COGS).
- Net profit.
- Transaction count.
- Quantity sold.

Profit is calculated from the cost price saved at the time of sale:

$$
	ext{Net Profit} = \sum (\text{Unit Price} - \text{Unit Cost}) \times \text{Quantity}
$$

Older sale records without a saved cost snapshot fall back to the product's current cost price.

## 7. Data Schema

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  selling_unit TEXT NOT NULL DEFAULT 'unit',
  cost_price REAL NOT NULL,
  selling_price REAL NOT NULL,
  stock_qty REAL DEFAULT 0,
  parent_id INTEGER,
  conversion_rate REAL NOT NULL DEFAULT 1,
  is_base_unit INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES products (id) ON DELETE SET NULL
);

CREATE TABLE sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total_amount REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  cash_received REAL NOT NULL,
  change_amount REAL NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'CASH',
  customer_id INTEGER,
  sale_note TEXT,
  debt_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  unit_cost REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  total_debt REAL NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE debt_repayments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  amount_paid REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
);
```

## 8. Navigation

The main navigation provides access to:

- Home inventory
- Daily reports
- Customer debt management
- Barcode scanner
- Cart and checkout

## 9. Reliability and Security

- Stock deduction, sale creation, and credit balance updates must run in an exclusive SQLite transaction.
- Repayments and customer balance updates must run in an exclusive SQLite transaction.
- Failed transactions must not leave partial stock, sale, or debt updates.
- Database migrations must preserve existing products and sales when new fields are introduced.

## 10. Future Scope

The following items are planned extensions and are not required for the current checkout implementation:

- Hold and restore parked carts.
- Customer sales and debt-note history screen.
- Printable or shareable receipts.
- Credit sales aging and repayment due dates.
- Daily and monthly report filtering.

# 📱 Home Grocery POS System - Software Requirements Specification (SRS)

## 1. Project Overview

- **Project Name:** Home Grocery POS (Mobile)
- **Target Audience:** မြန်မာနိုင်ငံရှိ အိမ်ဆိုင် / တစ်ပိုင်တစ်နိုင် ကုန်စုံဆိုင် ပိုင်ရှင်များ
- **Primary Goal:** စာအုပ်ဖြင့် စာရင်းမှတ်ခြင်း အစား ဖုန်းဖြင့် မြန်ဆန်စွာ အရောင်းမှတ်နိုင်ရန်၊ အကြွေးစာရင်း ထိန်းချုပ်နိုင်ရန် နှင့် အမြတ်စစ်စစ်ကို တွက်ချက်နိုင်ရန်။
- **Architecture:** Offline-First System (Internet လုံးဝ မလိုပါ)

---

## 2. Tech Stack & Tools

- **Frontend Framework:** React Native (Expo SDK 57 - TypeScript)
- **Local Database:** `expo-sqlite`
- **State Management:** Zustand (with Persistence for Cart State)
- **Hardware Interfacing:** `expo-camera` (Barcode Scanning), Hardware Keyboard Listener (USB Barcode Reader)

---

## 3. Database Schema Specification

```sql
-- 1. Products Table (ကုန်ပစ္စည်း စာရင်း)
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  cost_price REAL NOT NULL,      -- ဝယ်စျေး (အရင်း)
  selling_price REAL NOT NULL,   -- ရောင်းစျေး
  stock_qty INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers Table (အကြွေးဝယ်သူများ)
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  total_debt REAL DEFAULT 0,     -- လက်ရှိ အကြွေးကျန် စုစုပေါင်း
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Sales Table (အရောင်းစာရင်း)
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no TEXT UNIQUE NOT NULL,
  total_amount REAL NOT NULL,
  cash_received REAL NOT NULL,
  change_amount REAL NOT NULL,
  payment_type TEXT CHECK(payment_type IN ('CASH', 'CREDIT')) DEFAULT 'CASH',
  customer_id INTEGER,           -- CREDIT ဖြစ်ပါက Customer ID ပါမည်
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers (id)
);

-- 4. Sale Items Table (ရောင်းချခဲ့သော ပစ္စည်းအသေးစိတ်)
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost REAL NOT NULL,       -- ရောင်းချချိန်ရှိ အရင်းစျေး
  unit_price REAL NOT NULL,      -- ရောင်းချချိန်ရှိ ရောင်းစျေး
  subtotal REAL NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales (id),
  FOREIGN KEY (product_id) REFERENCES products (id)
);

-- 5. Debt Repayments Table (အကြွေးလာဆပ်သည့် စာရင်း)
CREATE TABLE IF NOT EXISTS debt_repayments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  amount_paid REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers (id)
);

## 4. Functional Requirements

### F1: Product & Stock Management
* **F1.1 Add/Edit Product:** Ability to create and update product details, including product name, barcode, cost price, selling price, and stock quantity.
* **F1.2 Barcode Duplicate Check:** System must validate barcode uniqueness and trigger an alert if a duplicate barcode is entered.
* **F1.3 Low Stock Warning:** System displays a visual warning on the dashboard when product stock falls below the threshold (`stock_qty < 5`).

### F2: POS Checkout & Cart Logic
* **F2.1 Scan to Cart:** Automatically add items to the cart upon scanning via the device camera or attached USB barcode reader.
* **F2.2 Manual Selection Grid:** Provide a visual product grid for barcodeless items, allowing users to tap and add products directly to the cart.
* **F2.3 Quantity Adjustment:** Enable quick incrementing, decrementing, or manual entry of item quantities within the cart.
* **F2.4 Hold Cart:** Allow cashiers to temporarily save (park) the current active cart as a draft to serve another customer, with the ability to restore it later.
* **F2.5 Payment Types:**
  * **CASH:** Process cash payments and automatically calculate exact change due.
  * **CREDIT (Account Receivable):** Select a registered customer and attach the bill to their profile, automatically updating `customers.total_debt`.

### F3: Debt Management
* **F3.1 Customer Debt List:** View a consolidated list of customers along with their current outstanding debt balances.
* **F3.2 Repay Debt:** Record partial or full debt repayments and automatically deduct the paid amount from the customer's balance.

### F4: Daily Reports & Profit Analytics
* **F4.1 Daily Summary:** View real-time aggregated metrics for total daily sales revenue and transaction counts.
* **F4.2 Net Profit Calculation:** Compute and display net profit by subtracting total cost of goods sold (COGS) from gross revenue:
  $$\text{Net Profit} = \sum (\text{Selling Price} - \text{Cost Price}) \times \text{Quantity}$$

---

## 5. Non-Functional Requirements

* **Performance:** High-speed barcode processing with latency under $200\text{ms}$ from scan recognition to cart update.
* **Reliability & Data Integrity:** Use database atomic transactions (`db.transaction()`) so stock quantities are reduced only upon successful sale completion.
* **Offline-First Architecture:** 100% operational capability without requiring an active internet connection.
```
