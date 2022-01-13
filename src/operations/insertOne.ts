import { Collection, Document, InferIdType, InsertOneOptions, InsertOneResult, ObjectId, OptionalId } from "mongodb";
import { logOperation } from "../logger";
import { WrappedCollection } from "../types";

export function wrapInsertOne<TSchema extends Document = Document>(fn: Collection["insertOne"]) {
  return async function insertOne(
    this: WrappedCollection<TSchema>,
    doc: OptionalId<TSchema>,
    options: InsertOneOptions
  ): Promise<InsertOneResult<TSchema>> {
    const { dry } = this.__migmong_options;
    logOperation(this.__migmong_log, "insertOne", "one document will be inserted", doc);

    if (dry) {
      // return what the mongo driver would in real life
      const insertedId = doc._id ?? new ObjectId();
      return {
        acknowledged: true,
        insertedId: insertedId as InferIdType<TSchema>,
      };
    }

    return fn(doc, options);
  };
}
