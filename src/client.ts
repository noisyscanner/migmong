import {
  Collection,
  Document,
  Filter,
  UpdateFilter,
  UpdateOptions,
  UpdateResult,
} from "mongodb";
import chalk from "chalk";

/**
 * TODO:
 *
 * - how can we handle overloads?
 * */

const dryRunPrefix = chalk.yellow.bold("[DRY RUN]");

function isDry() {
  const dry = process.env.DRY_RUN;
  return dry && dry !== "false";
}

function getLogger(isDry: boolean, loggerImpl: Logger = console.log) {
  if (!isDry) {
    return loggerImpl;
  }

  return (...args: unknown[]) => loggerImpl(dryRunPrefix, ...args);
}

function wrapUpdateOne<TSchema extends Document = Document>(
  fn: Collection["updateOne"]
) {
  return async function updateOne(
    this: WrappedCollection<TSchema>,
    filter: Filter<TSchema>,
    update: UpdateFilter<TSchema> | Partial<TSchema>,
    options: UpdateOptions
  ): Promise<UpdateResult> {
    const count = await this.countDocuments(filter);

    const dry = this.__migmong_options.dry;
    this.__migmong_log(
      chalk.blue.italic("updateOne"),
      `${chalk.bold(count)} documents matching\n`,
      filter,
      "\nwith\n",
      update
    );

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

const wrappers = {
  updateOne: wrapUpdateOne,
};

type Logger = (...args: unknown[]) => void;
type WrapCollectionOptions = {
  dry?: boolean;
  logger?: Logger;
};

interface WrappedCollection<TSchema extends Document = Document>
  extends Collection<TSchema> {
  __migmong_options: WrapCollectionOptions;
  __migmong_log: Logger;
}

export function wrapCollection<TSchema extends Document = Document>(
  collection: Collection<TSchema>,
  {
    dry = isDry(),
    logger: loggerImpl = console.log,
  }: WrapCollectionOptions = {}
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
