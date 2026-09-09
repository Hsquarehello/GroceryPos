import * as SQLite from "expo-sqlite";

// Local Database ဖွင့်ခြင်း
const db = SQLite.openDatabaseSync("grocery_pos.db");

export const initDatabase = () => {
  // Grocery Store အတွက် Tables များ ဆောက်ခြင်း
  db.execSync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS products (
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

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_amount REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      cash_received REAL NOT NULL,
      change_amount REAL NOT NULL,
      payment_type TEXT NOT NULL DEFAULT 'CASH' CHECK(payment_type IN ('CASH', 'CREDIT')),
      customer_id INTEGER,
      sale_note TEXT,
      debt_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      total_debt REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS debt_repayments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      amount_paid REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id)
    );
  `);

  try {
    db.execSync("ALTER TABLE sales ADD COLUMN discount_amount REAL DEFAULT 0;");
  } catch (e) {
    // Column ရှိပြီးသားဆိုလျှင် ကျော်သွားပါမည်
  }

  for (const statement of [
    "ALTER TABLE sales ADD COLUMN payment_type TEXT NOT NULL DEFAULT 'CASH'",
    "ALTER TABLE sales ADD COLUMN customer_id INTEGER",
    "ALTER TABLE sales ADD COLUMN sale_note TEXT",
    "ALTER TABLE sales ADD COLUMN debt_note TEXT",
  ]) {
    try {
      db.execSync(statement);
    } catch (e) {
      // Column already exists.
    }
  }

  try {
    db.execSync(
      "ALTER TABLE sale_items ADD COLUMN unit_cost REAL NOT NULL DEFAULT 0;",
    );
  } catch (e) {
    // Column already exists.
  }

  // Schema Migration စစ်ဆေးခြင်း
  const productColumns = db.getAllSync<{
    name: string;
    notnull: number;
    type: string;
  }>("PRAGMA table_info(products)");

  const hasPackagingColumns = [
    "parent_id",
    "conversion_rate",
    "is_base_unit",
  ].every((name) => productColumns.some((column) => column.name === name));
  const hasSellingUnitColumn = productColumns.some(
    (column) => column.name === "selling_unit",
  );
  const legacySellingUnit = hasSellingUnitColumn ? "selling_unit" : "'unit'";

  const barcodeIsOptional = productColumns.some(
    (column) => column.name === "barcode" && column.notnull === 0,
  );

  if (!hasPackagingColumns || !barcodeIsOptional || !hasSellingUnitColumn) {
    db.execSync(`
      PRAGMA foreign_keys = OFF;
      BEGIN TRANSACTION;
      
      ALTER TABLE products RENAME TO products_legacy;
      
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

      INSERT INTO products (id, barcode, name, selling_unit, cost_price, selling_price, stock_qty, parent_id, conversion_rate, is_base_unit, created_at)
        SELECT 
          id, 
          NULLIF(barcode, ''), 
          name, 
          CASE WHEN ${legacySellingUnit} IN ('kg', 'g') THEN ${legacySellingUnit} ELSE 'unit' END,
          cost_price, 
          selling_price, 
          stock_qty, 
          parent_id, 
          COALESCE(conversion_rate, 1), 
          COALESCE(is_base_unit, 1), 
          created_at 
        FROM products_legacy;

      CREATE TABLE sale_items_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        unit_cost REAL NOT NULL DEFAULT 0,
        FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id)
      );

      INSERT INTO sale_items_new (id, sale_id, product_id, quantity, unit_price, unit_cost)
        SELECT id, sale_id, product_id, quantity, unit_price, unit_cost FROM sale_items;

      DROP TABLE sale_items;
      DROP TABLE products_legacy;
      ALTER TABLE sale_items_new RENAME TO sale_items;
      
      COMMIT;
      PRAGMA foreign_keys = ON;
    `);
  }

  console.log("Database Tables initialized successfully!");
};

export default db;
