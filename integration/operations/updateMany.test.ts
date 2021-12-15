import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import stripAnsi from "strip-ansi";
import { connect } from "../helper";
import { wrapCollection } from "../../src/client";
import { getUsers, User } from "../fixtures";

const mockLog = jest.fn();

describe("updateMany", () => {
  let client: MongoClient;
  let db: Db;

  beforeAll(async () => {
    ({ client, db } = await connect());
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
    let collection: Collection;

    beforeEach(async () => {
      collection = wrapCollection(db.collection("users"), {
        dry: true,
        logger: mockLog,
      });
      users = getUsers();
      ({ insertedIds: userIds } = await collection.insertMany(users));
    });

    afterEach(async () => {
      await collection.deleteMany({ _id: { $in: Object.values(userIds) } });
    });

    // TODO: Maybe pull these tests up into some executor
    it("should log out the operation in dry run mode", async () => {
      // Update the name of the first 10 users
      const updatedProps = { name: "New updateMany name" };
      const first10users = users.slice(0, 10);
      const result = await collection.updateMany(
        { id: { $in: first10users.map((u) => u.id) } },
        { $set: updatedProps }
      );
      expect(result).toMatchInlineSnapshot(`
        Object {
          "acknowledged": true,
          "matchedCount": 10,
          "modifiedCount": 10,
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
    let collection: Collection;

    beforeEach(async () => {
      collection = wrapCollection(db.collection("users"), {
        dry: false,
        logger: mockLog,
      });
      users = getUsers();
      ({ insertedIds: userIds } = await collection.insertMany(users));
    });

    afterEach(async () => {
      await collection.deleteMany({ _id: { $in: Object.values(userIds) } });
    });

    it("should run for real and not log", async () => {
      // Update the name of the first 10 users
      const updatedProps = { name: "New updateMany name" };
      const first10users = users.slice(0, 10);
      const result = await collection.updateMany(
        { id: { $in: first10users.map((u) => u.id) } },
        { $set: updatedProps }
      );
      expect(result).toMatchInlineSnapshot(`
        Object {
          "acknowledged": true,
          "matchedCount": 10,
          "modifiedCount": 10,
          "upsertedCount": 0,
          "upsertedId": null,
        }
      `);

      const updatedDocsCount = await collection.countDocuments(updatedProps);
      expect(updatedDocsCount).toBe(10);
      expect(mockLog).toHaveReturnedTimes(1);
      expect(stripAnsi(mockLog.mock.calls[0][0])).not.toMatch(/^\[DRY RUN\]/);
    });
  });
});
