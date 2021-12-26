import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import stripAnsi from "strip-ansi";
import { connect } from "../helper";
import { wrapCollection } from "../../src/client";
import { getUsers, User } from "../fixtures";

const mockLog = jest.fn();

describe("updateOne", () => {
  let client: MongoClient;
  let collection: Collection;
  let db: Db;

  beforeAll(async () => {
    ({ client, db } = await connect());
  });

  beforeEach(() => {
    collection = db.collection("users");
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await client.close();
  });

  describe("dry run", () => {
    let users: User[];
    let userIds: Record<number, ObjectId>;
    let wrappedCollection: Collection;

    beforeEach(async () => {
      wrappedCollection = wrapCollection(collection, {
        dry: true,
        logger: mockLog,
      });
      users = getUsers();
      const result = await collection.insertMany(users);
      userIds = result.insertedIds;
    });

    afterEach(async () => {
      await collection.deleteMany({ _id: { $in: Object.values(userIds) } });
    });

    // TODO: Maybe pull these tests up into some executor
    it("should log out the operation in dry run mode", async () => {
      const updatedProps = { name: "New updateOne name" };
      const result = await wrappedCollection.updateOne({ id: { $in: users.map((u) => u.id) } }, { $set: updatedProps });
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
    let users: User[];
    let userIds: Record<number, ObjectId>;
    let wrappedCollection: Collection;

    beforeEach(async () => {
      wrappedCollection = wrapCollection(collection, {
        dry: false,
        logger: mockLog,
      });
      users = getUsers();
      const result = await collection.insertMany(users);
      userIds = result.insertedIds;
    });

    afterEach(async () => {
      await collection.deleteMany({ _id: { $in: Object.values(userIds) } });
    });

    it("should run for real and not log", async () => {
      const updatedProps = { name: "New updateOne name" };
      const result = await wrappedCollection.updateOne({ id: { $in: users.map((u) => u.id) } }, { $set: updatedProps });
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
