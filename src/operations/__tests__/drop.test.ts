import { wrapDrop } from "../drop";
import { mockCollection, stripLogLines } from "../../../test/test-utils";

const mockDrop = jest.fn();

const expectedLogCall = ["drop", "collection will be dropped"];

describe("drop", () => {
  const wrappedDrop = wrapDrop(mockDrop);

  afterEach(() => jest.clearAllMocks());

  describe("dry mode", () => {
    const collection = mockCollection(true);

    it("should log correctly and return a dummy result", async () => {
      const result = await wrappedDrop.call(collection);

      // Ensure stub response is correct and that real call was not made
      expect(result).toEqual(true);
      expect(mockDrop).not.toHaveBeenCalled();

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
      mockDrop.mockReturnValue(mockedReturnValue);
      const result = await wrappedDrop.call(collection);

      // Ensure stub response is correct and that real call was not made
      expect(result).toEqual(mockedReturnValue);
      expect(mockDrop).toHaveBeenCalledTimes(1);

      // Ensure logger was called with correct arguments
      expect(collection.__migmong_log).toHaveBeenCalledTimes(1);
      const strippedArgs = collection.__migmong_log.mock.calls.map(stripLogLines);

      expect(strippedArgs[0]).toEqual(expectedLogCall);
    });
  });
});
