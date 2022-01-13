import { Collection, Document } from "mongodb";
import { wrapUpdateMany } from "./operations/updateMany";
import { wrapUpdateOne } from "./operations/updateOne";
import { WrapCollectionOptions, WrappedCollection } from "./types";
import { getLogger } from "./logger";
import { isDry } from "./utils";
import { wrapDeleteMany } from "./operations/deleteMany";
import { wrapDeleteOne } from "./operations/deleteOne";
import { wrapInsertOne } from "./operations/insertOne";
import { wrapInsertMany } from "./operations/insertMany";

/**
 * TODO:
 *
 * - how can we handle overloads?
 * */

const wrappers = {
  updateOne: wrapUpdateOne,
  updateMany: wrapUpdateMany,
  deleteMany: wrapDeleteMany,
  deleteOne: wrapDeleteOne,
  insertOne: wrapInsertOne,
  insertMany: wrapInsertMany,
};

export function wrapCollection<TSchema extends Document = Document>(
  collection: Collection<TSchema>,
  // eslint-disable-next-line no-console
  { dry = isDry(), logger: loggerImpl = console.log }: WrapCollectionOptions = {}
) {
  const logger = getLogger(dry, loggerImpl);

  return new Proxy(collection, {
    get(target, prop, receiver) {
      if (prop === "__migmong_log") {
        return logger;
      }

      if (prop === "__migmong_options") {
        return { dry, logger };
      }

      const wrapper = wrappers[prop];
      if (wrapper) {
        return wrapper(target[prop].bind(target));
      }

      return Reflect.get(target, prop, receiver);
    },
  }) as WrappedCollection<TSchema>;
}
