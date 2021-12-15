import chalk from "chalk";
import { UpdateFilter, Document, Filter } from "mongodb";

export type Logger = (...args: unknown[]) => void;

export function logOperation<TSchema extends Document = Document>(
  logger: Logger,
  opName: string,
  docCount: number,
  filter: Filter<TSchema>,
  update: UpdateFilter<TSchema>
) {
  logger(chalk.blue.italic(opName), `${chalk.bold(docCount)} documents matching\n`, filter, "\nwith\n", update);
}

const dryRunPrefix = chalk.yellow.bold("[DRY RUN]");

export function getLogger(isDry: boolean, loggerImpl: Logger = console.log) {
  if (!isDry) {
    return loggerImpl;
  }

  return (...args: unknown[]) => loggerImpl(dryRunPrefix, ...args);
}
