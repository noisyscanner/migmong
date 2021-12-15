import { Collection, Document } from "mongodb";
import { Logger } from "./logger";

export type WrapCollectionOptions = {
  dry?: boolean;
  logger?: Logger;
};

export interface WrappedCollection<TSchema extends Document = Document> extends Collection<TSchema> {
  __migmong_options: WrapCollectionOptions;
  __migmong_log: Logger;
}
