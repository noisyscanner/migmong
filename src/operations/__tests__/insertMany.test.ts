import { ObjectId } from "mongodb";
import { wrapInsertMany } from "../insertMany";
import { mockCollection, stripLogLines } from "../../../test/test-utils";

const mockInsertMany = jest.fn();
const mockedDocumentCount = 100;

const docsToInsert = [
  { _id: "xxx", name: "Jimmy" },
  { _id: new ObjectId(), name: "Bob" },
  { _id: 123, name: "Angela" },
  { name: "Jane" }, // _id should be generated for this one
];

describe("insertMany", () => {
  const wrappedInsertMany = wrapInsertMany(mockInsertMany);

  afterEach(() => jest.clearAllMocks());

  describe("dry mode", () => {
    const collection = mockCollection(true, mockedDocumentCount);

    const expectedLogCall = ["insertMany", "4 documents will be inserted", docsToInsert];
    it("should log correctly and return a dummy result with generated IDs", async () => {
      const result = await wrappedInsertMany.call(collection, docsToInsert);

      // Ensure stub response is correct and that real call was not made
      expect(result).toEqual({
        acknowledged: true,
        insertedCount: 4,
        insertedIds: [docsToInsert[0]._id, docsToInsert[1]._id, docsToInsert[2]._id, expect.any(ObjectId)],
      });
      expect(mockInsertMany).not.toHaveBeenCalled();

      // Ensure logger was called with correct arguments
      expect(collection.__migmong_log).toHaveBeenCalledTimes(1);
      const strippedArgs = collection.__migmong_log.mock.calls.map(stripLogLines);

      expect(strippedArgs[0]).toEqual(expectedLogCall);
    });
  });

  describe("live mode", () => {
    const collection = mockCollection(false, mockedDocumentCount);
    const expectedLogCall = ["insertMany", "4 documents will be inserted", docsToInsert];

    it("should log correctly and return the real result", async () => {
      const mockedReturnValue = "Doesn't matter";
      mockInsertMany.mockReturnValue(mockedReturnValue);
      const result = await wrappedInsertMany.call(collection, docsToInsert);

      // Ensure stub response is correct and that real call was not made
      expect(result).toEqual(mockedReturnValue);
      expect(mockInsertMany).toHaveBeenCalledTimes(1);

      // Ensure logger was called with correct arguments
      expect(collection.__migmong_log).toHaveBeenCalledTimes(1);
      const strippedArgs = collection.__migmong_log.mock.calls.map(stripLogLines);

      expect(strippedArgs[0]).toEqual(expectedLogCall);
    });
  });
});
