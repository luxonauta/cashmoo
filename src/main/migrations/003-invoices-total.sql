BEGIN TRANSACTION;

PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS invoices_new(
  id INTEGER PRIMARY KEY,
  card_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total REAL NOT NULL DEFAULT 0,
  paid INTEGER NOT NULL DEFAULT 0,
  paid_at TEXT,
  FOREIGN KEY(card_id) REFERENCES cards(id)
);

INSERT INTO invoices_new(id, card_id, year, month, total, paid, paid_at)
SELECT 
  id,
  card_id,
  year,
  month,
  0,
  paid,
  paid_at
FROM invoices;

DROP TABLE invoices;

ALTER TABLE invoices_new RENAME TO invoices;

CREATE INDEX IF NOT EXISTS idx_invoices_card_period ON invoices(card_id, year, month);

PRAGMA foreign_keys=ON;

COMMIT;
