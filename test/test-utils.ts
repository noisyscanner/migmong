import stripAnsi from "strip-ansi";
import { WrappedCollection } from "../src/types";

export function mockCollection(isDry: boolean, mockedDocumentCount: number = 0) {
  return {
    __migmong_options: {
      dry: isDry,
    },
    __migmong_log: jest.fn(),
    countDocuments: jest.fn().mockResolvedValueOnce(mockedDocumentCount),
  } as unknown as jest.Mocked<WrappedCollection>;
}

export function stripLogLines(lines: (string | undefined)[]) {
  return lines.map((arg) => (typeof arg === "string" ? stripAnsi(arg.replace(/\n/g, "")) : arg));
}
