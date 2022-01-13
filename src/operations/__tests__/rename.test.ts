import { wrapRename } from "../rename";
import { mockCollection, stripLogLines } from "../../../test/test-utils";

const mockRename = jest.fn();

const newName = "new-collection-name";
const expectedLogCall = ["rename", "collection will be renamed to", newName];

describe("rename", () => {
  const wrappedRename = wrapRename(mockRename);

  afterEach(() => jest.clearAllMocks());

  describe("dry mode", () => {
    const collection = mockCollection(true);

    it("should log correctly and return a dummy result", async () => {
      const result = await wrappedRename.call(collection, newName);

      // Ensure stub response is correct and that real call was not made
      expect(result).toEqual(collection);
      expect(mockRename).not.toHaveBeenCalled();

      // Ensure logger was called with correct arguments
      expect(collection.__migmong_log).toHaveBeenCalledTimes(1);
      const strippedArgs = collection.__migmong_log.mock.calls.map(stripLogLines);

      expect(strippedArgs[0]).toEqual(expectedLogCall);
    });
  });

  describe("live mode", () => {
    const collection = mockCollection(false);

    it("should log correctly and return the real result", async () => {
      const mockedReturnValue = "Doesn't matter";
      mockRename.mockReturnValue(mockedReturnValue);
      const result = await wrappedRename.call(collection, newName);

      // Ensure stub response is correct and that real call was not made
      expect(result).toEqual(mockedReturnValue);
      expect(mockRename).toHaveBeenCalledTimes(1);

      // Ensure logger was called with correct arguments
      expect(collection.__migmong_log).toHaveBeenCalledTimes(1);
      const strippedArgs = collection.__migmong_log.mock.calls.map(stripLogLines);

      expect(strippedArgs[0]).toEqual(expectedLogCall);
    });
  });
});
