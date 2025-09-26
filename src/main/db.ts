import * as path from "node:path";
import * as fs from "node:fs";
import { app } from "electron";
import * as sqlite3 from "sqlite3";

let db: sqlite3.Database | null = null;

export async function getDb(): Promise<sqlite3.Database> {
  if (db) return db;
  const userData = app.getPath("userData");
  const dbDir = path.join(userData, "data");
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  const dbPath = path.join(dbDir, "finance.db");
  db = new sqlite3.Database(dbPath);
  await queryExec("PRAGMA foreign_keys=ON");
  return db;
}

export async function queryExec(sql: string): Promise<void> {
  const d = await getDb();
  await new Promise<void>((resolve, reject) => {
    d.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function queryRun(
  sql: string,
  params: Array<string | number | null> = []
): Promise<{ lastID: number; changes: number }> {
  const d = await getDb();
  return await new Promise((resolve, reject) => {
    d.run(sql, params, function (this: sqlite3.RunResult, err: Error | null) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export async function queryGet<T>(
  sql: string,
  params: Array<string | number | null> = []
): Promise<T> {
  const d = await getDb();
  return await new Promise((resolve, reject) => {
    d.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
}

export async function queryAll<T>(
  sql: string,
  params: Array<string | number | null> = []
): Promise<T[]> {
  const d = await getDb();
  return await new Promise((resolve, reject) => {
    d.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve((rows as T[]) || []);
    });
  });
}

export async function runMigrations(): Promise<void> {
  const appPath = app.isPackaged ? process.resourcesPath : process.cwd();
  const migrationsDir = app.isPackaged
    ? path.join(appPath, "migrations")
    : path.join(process.cwd(), "src/main/migrations");
  const files = (await fs.promises.readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const f of files) {
    const sql = await fs.promises.readFile(path.join(migrationsDir, f), 'utf-8');
    await queryExec(sql);
  }
}
