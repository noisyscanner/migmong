import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import stripAnsi from "strip-ansi";
import { connect } from "../helper";
import { wrapCollection } from "../../src/client";
import { getUsers, User } from "../fixtures";

const mockLog = jest.fn();

describe("deleteOne", () => {
  let client: MongoClient;
  let db: Db;

  beforeAll(async () => {
    ({ client, db } = await connect());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await client.close();
  });

  describe("dry run", () => {
    let users: User[];
    let userIds: Record<number, ObjectId>;
    let collection: Collection;
    let wrappedCollection: Collection;

    beforeEach(async () => {
      collection = db.collection("users");
      wrappedCollection = wrapCollection(collection, {
        dry: true,
        logger: mockLog,
      });
      users = getUsers();
      ({ insertedIds: userIds } = await collection.insertMany(users));
    });

    afterEach(async () => {
      await collection.deleteOne({ _id: { $in: Object.values(userIds) } });
    });

    // TODO: Maybe pull these tests up into some executor
    it("should log out the operation in dry run mode", async () => {
      // Update the name of the first 10 users
      const first10users = users.slice(0, 10);
      const query = { id: { $in: first10users.map((u) => u.id) } };
      const result = await wrappedCollection.deleteOne(query);
      expect(result).toMatchInlineSnapshot(`
        Object {
          "acknowledged": true,
          "deletedCount": 1,
        }
      `);

      // Ensure all documents are still there
      const totalDocsCount = await collection.countDocuments({ id: { $in: users.map((u) => u.id) } });
      expect(totalDocsCount).toBe(users.length);

      expect(mockLog).toHaveReturnedTimes(1);
      expect(stripAnsi(mockLog.mock.calls[0][0])).toMatch(/^\[DRY RUN\]/);
    });
  });

  describe("real run", () => {
    let users: User[];
    let userIds: Record<number, ObjectId>;
    let collection: Collection;
    let wrappedCollection: Collection;

    beforeEach(async () => {
      collection = db.collection("users");
      wrappedCollection = wrapCollection(collection, {
        dry: false,
        logger: mockLog,
      });
      users = getUsers();
      ({ insertedIds: userIds } = await collection.insertMany(users));
    });

    afterEach(async () => {
      await collection.deleteOne({ _id: { $in: Object.values(userIds) } });
    });

    it("should run for real and not log", async () => {
      // Delete the first 10 users with deleteOne
      // (only the first should be deleted)
      const first10users = users.slice(0, 10);
      const query = { id: { $in: first10users.map((u) => u.id) } };
      const result = await wrappedCollection.deleteOne(query);
      expect(result).toMatchInlineSnapshot(`
        Object {
          "acknowledged": true,
          "deletedCount": 1,
        }
      `);

      const totalDocsCount = await collection.countDocuments(query);
      expect(totalDocsCount).toBe(9);
      expect(mockLog).toHaveReturnedTimes(1);
      expect(stripAnsi(mockLog.mock.calls[0][0])).not.toMatch(/^\[DRY RUN\]/);
    });
  });
});
