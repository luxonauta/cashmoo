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

export function queryExec(sql: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const database = await getDb();
    database.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function queryRun(
  sql: string,
  params: Array<string | number | null> = []
): Promise<{ lastID: number; changes: number }> {
  return new Promise(async (resolve, reject) => {
    const database = await getDb();
    database.run(
      sql,
      params,
      function (this: sqlite3.RunResult, err: Error | null) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      }
    );
  });
}

export function queryGet<T>(
  sql: string,
  ...params: Array<string | number | null>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const database = await getDb();
    database.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
}

export function queryAll<T>(
  sql: string,
  ...params: Array<string | number | null>
): Promise<T[]> {
  return new Promise(async (resolve, reject) => {
    const database = await getDb();
    database.all(sql, params, (err, rows) => {
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
  const init = path.join(migrationsDir, "001-init.sql");
  const sql = await fs.promises.readFile(init, "utf-8");
  await queryExec(sql);
}
