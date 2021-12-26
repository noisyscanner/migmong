import { Collection, Document, Filter, UpdateFilter, UpdateOptions, UpdateResult } from "mongodb";
import { WrappedCollection } from "../types";
import { logOperation } from "../logger";

export function wrapUpdateMany<TSchema extends Document = Document>(fn: Collection["updateMany"]) {
  return async function updateMany(
    this: WrappedCollection<TSchema>,
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema> | Partial<TSchema>,
    options: UpdateOptions
  ): Promise<Document | UpdateResult> {
    const count = await this.countDocuments(filter);

    const dry = this.__migmong_options.dry;
    logOperation(this.__migmong_log, "updateMany", count, filter, update);

    if (dry) {
      // return what the mongo driver would in real life
      return {
        acknowledged: true,
        modifiedCount: count,
        upsertedId: null,
        upsertedCount: 0,
        matchedCount: count,
      };
    }

    return await fn(filter, update, options);
  };
}
