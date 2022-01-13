import { Collection, Document, Filter, DeleteOptions, DeleteResult } from "mongodb";
import { WrappedCollection } from "../types";
import { logUpdateOperation } from "../logger";

export function wrapDeleteOne<TSchema extends Document = Document>(fn: Collection["deleteOne"]) {
  return async function deleteOne(
    this: WrappedCollection<TSchema>,
    filter: Filter<TSchema>,
    options: DeleteOptions
  ): Promise<DeleteResult> {
    const count = await this.countDocuments(filter);

    const { dry } = this.__migmong_options;
    logUpdateOperation(this.__migmong_log, "deleteOne", count, filter);

    if (dry) {
      // return what the mongo driver would in real life
      return {
        acknowledged: true,
        deletedCount: 1,
      };
    }

    return fn(filter, options);
  };
}
