import { wrapInsertOne } from "../insertOne";
import { mockCollection, stripLogLines } from "../../../test/test-utils";
import { ObjectId } from "mongodb";

const mockInsertOne = jest.fn();
const mockedDocumentCount = 100;

const docToInsert = { name: "Jimmy" };
const docWithId = { ...docToInsert, _id: "some-id" };

describe("insertOne", () => {
  const wrappedInsertOne = wrapInsertOne(mockInsertOne);

  afterEach(() => jest.clearAllMocks());

  describe("dry mode", () => {
    const collection = mockCollection(true, mockedDocumentCount);

    describe("id is missing in doc", () => {
      const expectedLogCall = ["insertOne", "one document will be inserted", docToInsert];
      it("should log correctly and return a dummy result with a generated ID", async () => {
        const result = await wrappedInsertOne.call(collection, docToInsert);

        // Ensure stub response is correct and that real call was not made
        expect(result).toEqual({
          acknowledged: true,
          insertedId: expect.any(ObjectId),
        });
        expect(mockInsertOne).not.toHaveBeenCalled();

        // Ensure logger was called with correct arguments
        expect(collection.__migmong_log).toHaveBeenCalledTimes(1);
        const strippedArgs = collection.__migmong_log.mock.calls.map(stripLogLines);

        expect(strippedArgs[0]).toEqual(expectedLogCall);
      });
    });

    describe("id is present in doc", () => {
      const expectedLogCall = ["insertOne", "one document will be inserted", docWithId];
      it("should log correctly and return a dummy result with the existing ID", async () => {
        const result = await wrappedInsertOne.call(collection, docWithId);

        // Ensure stub response is correct and that real call was not made
        expect(result).toEqual({
          acknowledged: true,
          insertedId: docWithId._id,
        });
        expect(mockInsertOne).not.toHaveBeenCalled();

        // Ensure logger was called with correct arguments
        expect(collection.__migmong_log).toHaveBeenCalledTimes(1);
        const strippedArgs = collection.__migmong_log.mock.calls.map(stripLogLines);

        expect(strippedArgs[0]).toEqual(expectedLogCall);
      });
    });
  });

  describe("live mode", () => {
    const collection = mockCollection(false, mockedDocumentCount);
    const expectedLogCall = ["insertOne", "one document will be inserted", docToInsert];

    it("should log correctly and return the real result", async () => {
      const mockedReturnValue = "Doesn't matter";
      mockInsertOne.mockReturnValue(mockedReturnValue);
      const result = await wrappedInsertOne.call(collection, docToInsert);

      // Ensure stub response is correct and that real call was not made
      expect(result).toEqual(mockedReturnValue);
      expect(mockInsertOne).toHaveBeenCalledTimes(1);

      // Ensure logger was called with correct arguments
      expect(collection.__migmong_log).toHaveBeenCalledTimes(1);
      const strippedArgs = collection.__migmong_log.mock.calls.map(stripLogLines);

      expect(strippedArgs[0]).toEqual(expectedLogCall);
    });
  });
});
