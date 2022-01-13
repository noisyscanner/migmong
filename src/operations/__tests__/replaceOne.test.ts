import { wrapReplaceOne } from "../replaceOne";
import { mockCollection, stripLogLines } from "../../../test/test-utils";

const mockReplaceOne = jest.fn();
const mockedDocumentCount = 100;

const filter = { name: "Jimmy" };
const expectedLogCall = ["replaceOne", "100 documents matching", filter];

describe("replaceOne", () => {
  const wrappedReplaceOne = wrapReplaceOne(mockReplaceOne);

  afterEach(() => jest.clearAllMocks());

  describe("dry mode", () => {
    const collection = mockCollection(true, mockedDocumentCount);

    it("should log correctly and return a dummy result", async () => {
      const result = await wrappedReplaceOne.call(collection, filter);

      // Ensure stub response is correct and that real call was not made
      expect(result).toEqual({
        acknowledged: true,
        replacedCount: 1,
      });
      expect(mockReplaceOne).not.toHaveBeenCalled();

      // Ensure logger was called with correct arguments
      expect(collection.__migmong_log).toHaveBeenCalledTimes(1);
      const strippedArgs = collection.__migmong_log.mock.calls.map(stripLogLines);

      expect(strippedArgs[0]).toEqual(expectedLogCall);
    });
  });

  describe("live mode", () => {
    const collection = mockCollection(false, mockedDocumentCount);

    it("should log correctly and return the real result", async () => {
      const mockedReturnValue = "Doesn't matter";
      mockReplaceOne.mockReturnValue(mockedReturnValue);
      const result = await wrappedReplaceOne.call(collection, filter);

      // Ensure stub response is correct and that real call was not made
      expect(result).toEqual(mockedReturnValue);
      expect(mockReplaceOne).toHaveBeenCalledTimes(1);

      // Ensure logger was called with correct arguments
      expect(collection.__migmong_log).toHaveBeenCalledTimes(1);
      const strippedArgs = collection.__migmong_log.mock.calls.map(stripLogLines);

      expect(strippedArgs[0]).toEqual(expectedLogCall);
    });
  });
});
