import { wrapDeleteOne } from "../deleteOne";
import { mockCollection, stripLogLines } from "../../../test/test-utils";

const mockDeleteOne = jest.fn();
const mockedDocumentCount = 100;

const filter = { name: "Jimmy" };
const expectedLogCall = ["deleteOne", "100 documents matching", filter];

describe("deleteOne", () => {
  const wrappedDeleteOne = wrapDeleteOne(mockDeleteOne);

  afterEach(() => jest.clearAllMocks());

  describe("dry mode", () => {
    const collection = mockCollection(true, mockedDocumentCount);

    it("should log correctly and return a dummy result", async () => {
      const result = await wrappedDeleteOne.call(collection, filter);

      // Ensure stub response is correct and that real call was not made
      expect(result).toEqual({
        acknowledged: true,
        deletedCount: 1,
      });
      expect(mockDeleteOne).not.toHaveBeenCalled();

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
      mockDeleteOne.mockReturnValue(mockedReturnValue);
      const result = await wrappedDeleteOne.call(collection, filter);

      // Ensure stub response is correct and that real call was not made
      expect(result).toEqual(mockedReturnValue);
      expect(mockDeleteOne).toHaveBeenCalledTimes(1);

      // Ensure logger was called with correct arguments
      expect(collection.__migmong_log).toHaveBeenCalledTimes(1);
      const strippedArgs = collection.__migmong_log.mock.calls.map(stripLogLines);

      expect(strippedArgs[0]).toEqual(expectedLogCall);
    });
  });
});
