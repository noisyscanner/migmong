import { Collection, Document, InferIdType, BulkWriteOptions, InsertManyResult, ObjectId, OptionalId } from "mongodb";
import { logOperation } from "../logger";
import { WrappedCollection } from "../types";

export function wrapInsertMany<TSchema extends Document = Document>(fn: Collection["insertMany"]) {
  return async function insertMany(
    this: WrappedCollection<TSchema>,
    docs: OptionalId<TSchema>[],
    options: BulkWriteOptions
  ): Promise<InsertManyResult<TSchema>> {
    const { dry } = this.__migmong_options;
    logOperation(this.__migmong_log, "insertMany", `${docs.length} documents will be inserted`, docs);

    if (dry) {
      // return what the mongo driver would in real life
      const insertedIds = docs.map((doc) => doc._id ?? new ObjectId());
      return {
        acknowledged: true,
        insertedCount: docs.length,
        insertedIds: insertedIds as InferIdType<TSchema>[],
      };
    }

    return fn(docs, options);
  };
}
