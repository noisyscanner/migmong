import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import { promises as fs } from "fs";
import path from "path";
import { connect } from "./helper";
import { Runner } from "../src/runner";
import { MigrationDoc } from "../src/types";

const FIXTURES_DIR = path.join(__dirname, "__fixtures__");
const dbName = "migmong-test";
const config = { mongo: { db: dbName }, migrationsCollection: "migrations" };

async function getMusicianFixtures() {
  const musicianFixturesDir = path.join(FIXTURES_DIR, "musicians");
  const files = await fs.readdir(musicianFixturesDir);
  return Promise.all(
    files
      .filter((fileName) => /\.json$/.test(fileName))
      .map(async (fileName) => {
        const fullPath = path.join(musicianFixturesDir, fileName);
        const buffer = await fs.readFile(fullPath);
        return JSON.parse(buffer.toString());
      })
  );
}

describe("up", () => {
  let client: MongoClient;
  let db: Db;
  let musiciansCollection: Collection;
  let migrationsCollection: Collection<MigrationDoc>;
  let runner: Runner;

  beforeAll(async () => {
    client = await connect();
    runner = new Runner(client, config);
    db = client.db(dbName);
  });

  beforeEach(() => {
    musiciansCollection = db.collection("musicians");
    migrationsCollection = db.collection(config.migrationsCollection);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await musiciansCollection.deleteMany({});
    await migrationsCollection.deleteMany({});
  });

  afterAll(async () => {
    await client.close();
  });

  describe("live run", () => {
    test("migration runs and is recorded in migrations collection", async () => {
      // Seed some initial data into the database
      const musicianFixtures = await getMusicianFixtures();
      await musiciansCollection.insertMany(musicianFixtures);

      await runner.up();

      // Ensure that the migrations were actually ran

      // 001-test-migration
      // Reggae musicians should have ska removed
      expect(await musiciansCollection.countDocuments({ genres: "Ska" })).toBe(0);

      // Ensure migration was recorded in migrations collection
      const migrationEntry = await migrationsCollection.findOne({});
      expect(migrationEntry).toEqual({
        _id: expect.any(ObjectId),
        fileName: "001-test-migration.ts",
        appliedAt: expect.any(Date),
      });
    });
  });
});
