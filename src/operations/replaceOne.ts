import { Collection, Document, Filter, ReplaceOptions, UpdateResult } from "mongodb";
import { WrappedCollection } from "../types";
import { logUpdateOperation } from "../logger";

export function wrapReplaceOne<TSchema extends Document = Document>(fn: Collection["replaceOne"]) {
  return async function replaceOne(
    this: WrappedCollection<TSchema>,
    filter: Filter<TSchema>,
    options: ReplaceOptions
  ): Promise<Document | UpdateResult> {
    const count = await this.countDocuments(filter);

    const { dry } = this.__migmong_options;
    logUpdateOperation(this.__migmong_log, "replaceOne", count, filter);

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

    return fn(filter, options);
  };
}
