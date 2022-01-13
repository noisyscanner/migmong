import { Collection, RenameOptions } from "mongodb";
import { logOperation } from "../logger";
import { WrappedCollection } from "../types";

export function wrapRename(fn: Collection["rename"]) {
  return async function rename(this: WrappedCollection, newName: string, options: RenameOptions): Promise<Collection> {
    const { dry } = this.__migmong_options;
    logOperation(this.__migmong_log, "rename", "collection will be renamed to", newName);

    if (dry) {
      return this;
    }

    return fn(newName, options);
  };
}
