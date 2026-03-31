import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH =
  process.env.DATABASE_PATH ??
  path.join(process.cwd(), "data", "dashboard.db");

// Crée le dossier si inexistant (Docker volume ou local)
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const settingsDb = new Database(DB_PATH);

// Optimisations SQLite
settingsDb.pragma("journal_mode = WAL");
settingsDb.pragma("synchronous = NORMAL");

// Initialisation automatique au premier démarrage
settingsDb.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
  );
`);

export default settingsDb;
