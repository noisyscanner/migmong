import path from "path";
import { promises as fs } from "fs";
import { Db, MongoClient } from "mongodb";
import { MigrationDoc, MigrationModule } from "./types";

interface Config {
  mongo: {
    host?: string;
    port?: number;
    db: string;
  };
  dry?: boolean;
  migrationsDir?: string;
  migrationsCollection?: string;
}

const defaultConfig = {
  migrationsDir: path.join(__dirname, "../test-migrations"),
  migrationsCollection: "migrations",
};

async function getMigrationFiles(config: Config) {
  const dirStat = await fs.stat(config.migrationsDir);
  // TODO: this throw may not work as stat may throw if does not exist
  if (!dirStat.isDirectory()) {
    throw Error("Migrations dir does not exist");
  }

  const files = await fs.readdir(config.migrationsDir);
  return files.filter((fileName) => /\.ts$/.test(fileName));
}

async function getAlreadyRanMigrationFiles(db: Db, config: Config) {
  const docs = await db.collection<MigrationDoc>(config.migrationsCollection).find({}).toArray();
  return docs.map((doc) => doc.fileName);
}

async function getMigrationFilesToRun(db: Db, config: Config) {
  const allMigrationFiles = await getMigrationFiles(config);
  const migrationsAlreadyRan = await getAlreadyRanMigrationFiles(db, config);

  return allMigrationFiles.filter((fileName) => !migrationsAlreadyRan.includes(fileName));
}

async function importMigrationFile(migrationFile: string): Promise<MigrationModule> {
  return import(migrationFile);
}

// TODO: Use config to decide whether to run in dry mode or not
export class Runner {
  private db: Db;

  private config: Config;

  // eslint-disable-next-line no-useless-constructor,no-empty-function
  constructor(private client: MongoClient, config: Config) {
    // TODO: deep merge
    this.config = {
      ...defaultConfig,
      ...config,
    };
    this.db = client.db(config.mongo.db);
  }

  // TODO: Logging - print out migration name (and prepend logs for operations with it?)
  async up() {
    const migrationsToRun = await getMigrationFilesToRun(this.db, this.config);

    for (const file of migrationsToRun) {
      const fullPath = path.join(this.config.migrationsDir, file);
      const { up: runUp } = await importMigrationFile(fullPath);

      if (typeof runUp !== "function") {
        throw Error(`up migration is not defined for ${file}`);
      }

      await runUp(this.db, this.client);

      // Record ran migration in db
      await this.db.collection<MigrationDoc>(this.config.migrationsCollection).insertOne({
        fileName: file,
        appliedAt: new Date(),
      });
    }
  }
}

// TESTS
// - should not run rest if one fails
// - should only run migrations that end in .ts and have not already been ran
// - throws if migrations folder does not exist, or if migration does not export up or down
