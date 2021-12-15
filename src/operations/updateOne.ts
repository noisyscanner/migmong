import { Collection, Document, Filter, UpdateFilter, UpdateOptions, UpdateResult } from "mongodb";
import { WrappedCollection } from "../types";
import { logOperation } from "../logger";

export function wrapUpdateOne<TSchema extends Document = Document>(fn: Collection["updateOne"]) {
  return async function updateOne(
    this: WrappedCollection<TSchema>,
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema> | Partial<TSchema>,
    options: UpdateOptions
  ): Promise<UpdateResult> {
    const count = await this.countDocuments(filter);

    logOperation(this.__migmong_log, "updateOne", count, filter, update);

    const dry = this.__migmong_options.dry;

    if (dry) {
      // return what the mongo driver would in real life
      return {
        acknowledged: true,
        modifiedCount: 1,
        upsertedId: null,
        upsertedCount: 0,
        matchedCount: 1,
      };
    }

    return await fn(filter, update, options);
  };
}
