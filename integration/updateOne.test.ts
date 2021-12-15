import { Collection, Db, MongoClient } from "mongodb";
import stripAnsi from "strip-ansi";
import { connect } from "../src/test-utils";
import { wrapCollection } from "../src/client";

const mockLog = jest.fn().mockImplementation(console.log);

const getPatient = () => ({
  id: Math.round(Math.random() * 10000),
  name: "Brad",
});

describe("updateOne", () => {
  const patients = new Array(20).fill(null).map(getPatient);
  let client: MongoClient;
  let db: Db;
  let collection: Collection;

  beforeAll(async () => {
    ({ client, db } = await connect());
  });

  afterEach(async () => {
    await collection.drop();
    collection = undefined;
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await client.close();
  });

  describe("dry run", () => {
    beforeEach(async () => {
      collection = wrapCollection(db.collection("users"), {
        dry: true,
        logger: mockLog,
      });
      await collection.insertMany(patients);
    });

    // TODO: Maybe pull these tests up into some executor
    it("should log out the operation in dry run mode", async () => {
      const updatedProps = { name: "New Name" };
      const result = await collection.updateOne(
        { id: { $in: patients.map((p) => p.id) } },
        { $set: updatedProps }
      );
      expect(result).toMatchInlineSnapshot(`
        Object {
          "acknowledged": true,
          "matchedCount": 1,
          "modifiedCount": 1,
          "upsertedCount": 0,
          "upsertedId": null,
        }
      `);

      const updatedDocsCount = await collection.countDocuments(updatedProps);
      expect(updatedDocsCount).toBe(0);

      expect(mockLog).toHaveReturnedTimes(1);
      expect(stripAnsi(mockLog.mock.calls[0][0])).toMatch(/^\[DRY RUN\]/);
    });
  });

  describe("real run", () => {
    beforeEach(async () => {
      collection = wrapCollection(db.collection("users"), {
        dry: false,
        logger: mockLog,
      });
      await collection.insertMany(patients);
    });

    it("should run for real and not log", async () => {
      const updatedProps = { name: "New Name" };
      const result = await collection.updateOne(
        { id: { $in: patients.map((p) => p.id) } },
        { $set: updatedProps }
      );
      expect(result).toMatchInlineSnapshot(`
        Object {
          "acknowledged": true,
          "matchedCount": 1,
          "modifiedCount": 1,
          "upsertedCount": 0,
          "upsertedId": null,
        }
      `);

      const updatedDocsCount = await collection.countDocuments(updatedProps);
      expect(updatedDocsCount).toBe(1);
      expect(mockLog).toHaveReturnedTimes(1);
      expect(stripAnsi(mockLog.mock.calls[0][0])).not.toMatch(/^\[DRY RUN\]/);
    });
  });
});
