# GroceryPOS Specification

## 1. Overview

GroceryPOS is a mobile Point-of-Sale (POS) and inventory management application built with Expo and React Native. It is designed for local grocery stores or small retail shops that need to manage stock, pricing, barcode scans, customer debt, and simple sales reporting from a single offline-first app.

The app uses local SQLite storage so data remains available without a backend or internet connection. It is optimized for Android and iOS devices and supports barcode-driven product lookup and checkout workflows.

## 2. Product Goal

The main goal is to provide a fast, simple, and reliable solution for:

- tracking stock items and prices,
- scanning product barcodes,
- creating sales transactions quickly,
- monitoring low-stock items,
- recording customer debt and repayments,
- generating daily sales summaries.

## 3. Target Users

- Small grocery shop owners
- Store managers
- Cashiers
- Retail staff responsible for stock and sales records

## 4. Core Features

### 4.1 Product Inventory Management

- Add new products with:
  - barcode
  - name
  - cost price
  - selling price
  - stock quantity
  - selling unit
  - package conversion settings
- Edit existing product information.
- Delete products from inventory.
- Search products by name or barcode.
- Display a low-stock indicator for products under threshold.

### 4.2 Barcode Scanner

- Scan a barcode to identify a product.
- Support product entry through barcode capture.
- Support scanning for product search and cart operations.

### 4.3 Shopping Cart and Checkout

- Add products to a cart.
- Adjust item quantity before checkout.
- Calculate totals, cash received, and change.
- Support payment type selection, including cash and credit.
- Save sales transactions to local storage.

### 4.4 Sales and Transactions

- Record sale items with unit price and cost.
- Track total sale amount and discount.
- Save transaction metadata such as:
  - payment type
  - customer
  - notes
  - debt note
- Review transaction history.

### 4.5 Customer and Debt Tracking

- Add customers.
- Record debt balances.
- Accept repayment entries.
- Associate sales with customer accounts.
- Display outstanding debt status and payment activity.

### 4.6 Daily Reporting

- Show sales summary information.
- Display total sold quantities.
- Provide reports related to daily transactions and stock movement.

### 4.7 Local Persistence

- Use SQLite database for reliable local data persistence.
- Initialize required tables during app startup.
- Include migration logic for database schema upgrades.

## 5. Functional Requirements

### FR-01: Product list

The app shall display a searchable list of products with key details such as name, stock quantity, and price.

### FR-02: Add product

The user shall be able to add a product with required fields and valid pricing information.

### FR-03: Edit product

The user shall be able to update product information after creation.

### FR-04: Delete product

The user shall be able to remove a product from the inventory list with a confirmation prompt.

### FR-05: Barcode-assisted workflow

The app shall support scanning a product barcode and using the result to either add a new product or place an item in the cart.

### FR-06: Cart management

The app shall allow adding and removing cart items, adjusting quantities, and confirming checkout.

### FR-07: Transaction processing

The app shall save each sale to persistent storage with transaction details and line items.

### FR-08: Reporting

The app shall provide report screens for summaries such as sold quantities and daily transaction results.

### FR-09: Debt tracking

The app shall allow customers to be created and linked to sales/debt repayment records.

### FR-10: Low stock alerts

The app shall flag products whose stock is below a defined threshold.

## 6. Non-Functional Requirements

- Offline-first operation with local data storage.
- Fast UI response for search and product listing.
- Mobile-friendly layout optimized for touch interaction.
- Data integrity through SQLite constraints and foreign keys.
- Application should work reliably without requiring an external server.
- The app should support future extension for cloud sync or export features.

## 7. App Screens

The application includes the following screens:

- Home / Products
- Add Product
- Edit Product
- Scanner
- Cart / Checkout
- Reports
- Transactions
- Quantity Sold
- Customers

## 8. Data Model

### Products

- id
- barcode
- name
- selling_unit
- cost_price
- selling_price
- stock_qty
- parent_id
- conversion_rate
- is_base_unit
- created_at

### Sales

- id
- total_amount
- discount_amount
- cash_received
- change_amount
- payment_type
- customer_id
- sale_note
- debt_note
- created_at

### Customers

- id
- name
- phone
- total_debt
- created_at

### Debt Repayments

- id
- customer_id
- amount_paid
- created_at

### Sale Items

- id
- sale_id
- product_id
- quantity
- unit_price
- unit_cost

## 9. Technical Stack

- Expo SDK 57
- React Native 0.86.3
- React 19.2.3
- TypeScript 6.0.3
- Expo SQLite for persistence
- Zustand for state management
- React Navigation for screen navigation
- expo-camera for barcode scanning
- @expo/vector-icons for UI icons

## 10. Development Notes

- The app is configured as an Expo application using app.json and index.ts.
- Database initialization occurs during app startup in App.tsx.
- Data migration logic is implemented to support schema updates for products and sale items.
- The UI uses a modern mobile layout with product cards, summary rows, and floating action buttons.

## 11. Success Criteria

The project is successful when:

- user can add, search, edit, and delete products,
- checkout works with barcode scan or item selection,
- sale information is saved reliably,
- customer debt and repayment records are tracked,
- stock and sales reports are visible and useful,
- the app works offline in a local retail environment.

## 12. Future Enhancements

- Export data to CSV or PDF
- Cloud backup/sync
- User authentication for staff roles
- Multi-store management
- Inventory restocking workflows
- Advanced sales analytics and charts
- Print receipt support
