import { MongoClient } from "mongodb";

const config = {
  // host: "127.0.0.1",
  host: "BRAD-PC",
  port: 27017,
};

export async function connect() {
  const url = `mongodb://${config.host}:${config.port}`;
  const client = new MongoClient(url);

  try {
    // Connect the client to the server
    await client.connect();
    // Establish and verify connection
    await client.db("admin").command({ ping: 1 });
  } catch (err) {
    console.error("Connection to mongo failed", err);
    // Ensures that the client will close when you finish/error
    await client.close();
  }

  return client;
}
