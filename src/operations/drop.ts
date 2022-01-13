import { Collection, DropCollectionOptions } from "mongodb";
import { logOperation } from "../logger";
import { WrappedCollection } from "../types";

export function wrapDrop(fn: Collection["drop"]) {
  return async function drop(this: WrappedCollection, options: DropCollectionOptions): Promise<boolean> {
    const { dry } = this.__migmong_options;
    logOperation(this.__migmong_log, "drop", "collection will be dropped");

    if (dry) {
      return true;
    }

    return fn(options);
  };
}
