import { Db } from "mongodb";

interface MusicianDoc {
  name: string;
  gender: "M" | "F";
  genres: string[];
}

export async function up(db: Db) {
  const collection = db.collection<MusicianDoc>("musicians");
  // const musicians = await collection.find({}).toArray();
  // console.log(musicians);

  // Remove ska from all reggae musicians
  await collection.updateMany({ genres: "Reggae" }, { $pull: { genres: "Ska" } });
}
