import { logger } from "../../ui/utils/logger.js";

const CURRENT_SCHEMA_VERSION = 1;
const SCHEMA_VERSION_KEY = "@anki_schema_version";

export async function runMigrations(): Promise<void> {
  let currentVersion = 0;
  if (typeof localStorage !== "undefined") {
    const raw = localStorage.getItem(SCHEMA_VERSION_KEY);
    currentVersion = raw ? parseInt(raw, 10) : 0;
  }

  if (currentVersion < 1) {
    logger.info("Running schema migration v0 -> v1");
    // Migration v0 -> v1 logic: add initial version tag
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
    }
  }

  logger.info(`Schema version up to date: v${CURRENT_SCHEMA_VERSION}`);
}
