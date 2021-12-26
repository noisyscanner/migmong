import { Collection, Document, Filter, DeleteOptions, DeleteResult } from "mongodb";
import { WrappedCollection } from "../types";
import { logOperation } from "../logger";

export function wrapDeleteMany<TSchema extends Document = Document>(fn: Collection["deleteMany"]) {
  return async function deleteMany(
    this: WrappedCollection<TSchema>,
    filter: Filter<TSchema>,
    options: DeleteOptions
  ): Promise<DeleteResult> {
    const count = await this.countDocuments(filter);

    const dry = this.__migmong_options.dry;
    logOperation(this.__migmong_log, "deleteMany", count, filter);

    if (dry) {
      // return what the mongo driver would in real life
      return {
        acknowledged: true,
        deletedCount: count,
      };
    }

    return await fn(filter, options);
  };
}
