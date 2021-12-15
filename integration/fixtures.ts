import { ObjectId } from "mongodb";

export type User = ReturnType<typeof getUser>;
export const getUser = () => ({
  _id: new ObjectId(),
  id: Math.round(Math.random() * 10000),
  name: "Brad",
});

export const getUsers = (numberOfUsers = 20) => new Array(numberOfUsers).fill(null).map(getUser);
