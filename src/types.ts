import { Collection, Document, Db, MongoClient } from "mongodb";
import { Logger } from "./logger";

export type WrapCollectionOptions = {
  dry?: boolean;
  logger?: Logger;
};

export interface WrappedCollection<TSchema extends Document = Document> extends Collection<TSchema> {
  __migmong_options: WrapCollectionOptions;
  __migmong_log: Logger;
}

export interface MigrationDoc {
  fileName: string;
  appliedAt: Date;
}

export interface MigrationModule {
  up(db: Db, client: MongoClient): Promise<void>;
  down(db: Db, client: MongoClient): Promise<void>;
}
