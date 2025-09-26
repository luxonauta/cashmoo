PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS user_profile(
  id INTEGER PRIMARY KEY CHECK (id=1),
  name TEXT NOT NULL
);
INSERT OR IGNORE INTO user_profile(id,name) VALUES(1,'User');

CREATE TABLE IF NOT EXISTS incomes(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  amount REAL NOT NULL,
  recurrence TEXT NOT NULL CHECK (recurrence IN ('none','weekly','monthly','yearly')),
  start_date TEXT NOT NULL,
  end_date TEXT,
  next_date TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS expenses(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  recurrence TEXT NOT NULL CHECK (recurrence IN ('none','weekly','monthly','yearly')),
  auto_debit INTEGER NOT NULL DEFAULT 0,
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  is_card INTEGER NOT NULL DEFAULT 0,
  card_id INTEGER,
  next_date TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  paid_at TEXT,
  FOREIGN KEY(card_id) REFERENCES cards(id)
);

CREATE TABLE IF NOT EXISTS cards(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  closing_day INTEGER NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  limit_amount REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices(
  id INTEGER PRIMARY KEY,
  card_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  closing_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  total_amount REAL NOT NULL DEFAULT 0,
  paid INTEGER NOT NULL DEFAULT 0,
  paid_at TEXT,
  UNIQUE(card_id,year,month),
  FOREIGN KEY(card_id) REFERENCES cards(id)
);

CREATE TABLE IF NOT EXISTS notifications(
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('income','expense','invoice')),
  ref_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0
);
