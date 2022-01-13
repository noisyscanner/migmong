import path from "path";
import { promises as fs } from "fs";
import { Db, MongoClient } from "mongodb";
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

// TODO: Accept config object instead of db
//       Use config to decide whether to run in dry mode or not
export class Runner {
  // eslint-disable-next-line no-useless-constructor,no-empty-function
  constructor(private db: Db, private client: MongoClient) {}

  async up() {
    const migrationsToRun = await getMigrationFilesToRun(this.db);
    await runMigrations(this.db, this.client, migrationsToRun);
  }
}

// TESTS
// - should not run rest if one fails
// - should only run migrations that end in .ts and have not already been ran
// - throws if migrations folder does not exist, or if migration does not export up or down
