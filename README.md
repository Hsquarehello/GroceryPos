# GroceryPOS

GroceryPOS is a mobile grocery point-of-sale and inventory management application built with Expo and React Native. It helps small retail stores manage products, track stock, scan barcodes, process sales, and monitor customer debt using a local SQLite database.

## Features

- Product inventory management
- Search products by name or barcode
- Add, edit, and delete products
- Barcode scanning for product lookup and checkout
- Shopping cart and checkout workflow
- Cash and credit payment support
- Customer debt tracking and repayments
- Daily sales and quantity reports
- Offline local storage using SQLite

## Tech Stack

- Expo SDK 57
- React Native 0.86.3
- React 19.2.3
- TypeScript
- Expo SQLite
- Zustand
- React Navigation
- Expo Camera
- Expo Vector Icons

## Project Structure

```text
GroceryPOS/
├── App.tsx
├── app.json
├── index.ts
├── package.json
├── README.md
├── SPEC.md
├── src/
│   ├── components/
│   ├── database/
│   ├── screens/
│   ├── store/
│   ├── types/
│   └── ...
└── assets/
```

## Getting Started

### Prerequisites

- Node.js 22 or newer
- npm or yarn
- Expo CLI
- Android Studio / Xcode for device simulation

### Install dependencies

```bash
npm install
```

### Start the app

```bash
npm start
```

### Run on Android

```bash
npm run android
```

### Run on iOS

```bash
npm run ios
```

### Run in web mode

```bash
npm run web
```

## Main App Flow

1. Open the home screen to view inventory.
2. Add or edit products with pricing and stock fields.
3. Use the scanner to read barcodes for product identification.
4. Add items to the cart and complete a checkout.
5. Review reports and transaction history.
6. Manage customers and debt records as needed.

## Local Database

The app uses Expo SQLite with a local database file named `grocery_pos.db`. Database tables include products, sales, customers, debt_repayments, and sale_items. Database initialization and migration logic are handled in `src/database/db.ts`.

## Notes

This app is designed as a local-first retail POS and is well suited for small businesses that do not need a remote backend immediately.

## License

This project is licensed under the MIT license.
