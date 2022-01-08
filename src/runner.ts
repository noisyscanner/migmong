import path from "path";
import { promises as fs } from "fs";
import { Db, MongoClient } from "mongodb";
import { connect } from "./utils";
import { MigrationDoc, MigrationModule } from "./types";

const config = {
  migrationsDir: path.join(__dirname, "../test-migrations"),
  migrationsCollection: "migrations",
};

async function getMigrationFiles() {
  const dirStat = await fs.stat(config.migrationsDir);
  // TODO: this throw may not work as stat may throw if does not exist
  if (!dirStat.isDirectory()) {
    throw Error("Migrations dir does not exist");
  }

  const files = await fs.readdir(config.migrationsDir);
  return files.filter((fileName) => /\.ts$/.test(fileName));
}

async function getAlreadyRanMigrationFiles(db: Db) {
  const docs = await db.collection<MigrationDoc>(config.migrationsCollection).find({}).toArray();
  return docs.map((doc) => doc.fileName);
}

async function getMigrationFilesToRun(db: Db) {
  const allMigrationFiles = await getMigrationFiles();
  const migrationsAlreadyRan = await getAlreadyRanMigrationFiles(db);

  return allMigrationFiles.filter((fileName) => !migrationsAlreadyRan.includes(fileName));
}

async function importMigrationFile(migrationFile: string): Promise<MigrationModule> {
  return import(migrationFile);
}

// TODO: Logging - print out migration name (and prepend logs for operations with it?)
async function runMigrations(db: Db, client: MongoClient, migrationFiles: string[]) {
  for (const file of migrationFiles) {
    const fullPath = path.join(config.migrationsDir, file);
    const { up: runUp } = await importMigrationFile(fullPath);

    if (typeof runUp !== "function") {
      throw Error(`up migration is not defined for ${file}`);
    }

    await runUp(db, client);

    // Record ran migration in db
    await db.collection<MigrationDoc>(config.migrationsCollection).insertOne({
      fileName: file,
      appliedAt: new Date(),
    });
  }
}

// TODO: Instead of connecting in here, maybe instantiate some migration class that has a connection and can do it
// so that in tests we can connect, and then tear down the connection after
export async function up() {
  const { db, client } = await connect();
  const migrationsToRun = await getMigrationFilesToRun(db);
  await runMigrations(db, client, migrationsToRun);
}

// TESTS
// - should not run rest if one fails
// - should only run migrations that end in .ts and have not already been ran
// - throws if migrations folder does not exist, or if migration does not export up or down
