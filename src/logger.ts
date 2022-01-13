import chalk from "chalk";
import { UpdateFilter, Document, Filter } from "mongodb";

export type Logger = (..._args: unknown[]) => void;

export function logOperation(logger: Logger, opName: string, ...logArgs: unknown[]) {
  logger(chalk.blue.italic(opName), ...logArgs);
}

export function logUpdateOperation<TSchema extends Document = Document>(
  logger: Logger,
  opName: string,
  docCount: number,
  filter: Filter<TSchema>,
  update?: UpdateFilter<TSchema>
) {
  const logArgs = [`${chalk.bold(docCount)} documents matching\n`, filter];

  if (update) {
    logArgs.push("\nwith\n", update);
  }

  logOperation(logger, opName, ...logArgs);
}

const dryRunPrefix = chalk.yellow.bold("[DRY RUN]");

// eslint-disable-next-line no-console
export function getLogger(isDry: boolean, loggerImpl: Logger = console.log) {
  if (!isDry) {
    return loggerImpl;
  }

  return (...args: unknown[]) => loggerImpl(dryRunPrefix, ...args);
}
