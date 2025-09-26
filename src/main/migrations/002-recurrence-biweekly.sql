BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS incomes_new(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  amount REAL NOT NULL,
  recurrence TEXT NOT NULL CHECK (recurrence IN ('none','weekly','biweekly','monthly','yearly')),
  start_date TEXT NOT NULL,
  end_date TEXT,
  next_date TEXT,
  active INTEGER NOT NULL DEFAULT 1
);
INSERT INTO incomes_new(id,name,company,amount,recurrence,start_date,end_date,next_date,active)
SELECT id,name,company,amount,recurrence,start_date,end_date,next_date,active FROM incomes;
DROP TABLE incomes;
ALTER TABLE incomes_new RENAME TO incomes;

CREATE TABLE IF NOT EXISTS expenses_new(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  recurrence TEXT NOT NULL CHECK (recurrence IN ('none','weekly','biweekly','monthly','yearly')),
  auto_debit INTEGER NOT NULL DEFAULT 0,
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  is_card INTEGER NOT NULL DEFAULT 0,
  card_id INTEGER,
  next_date TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  paid_at TEXT,
  FOREIGN KEY(card_id) REFERENCES cards(id)
);
INSERT INTO expenses_new(id,name,description,amount,recurrence,auto_debit,due_day,is_card,card_id,next_date,active,paid_at)
SELECT id,name,description,amount,recurrence,auto_debit,due_day,is_card,card_id,next_date,active,paid_at FROM expenses;
DROP TABLE expenses;
ALTER TABLE expenses_new RENAME TO expenses;

COMMIT;
