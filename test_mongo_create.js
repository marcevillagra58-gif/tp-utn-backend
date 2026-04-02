import dotenv from "dotenv";
dotenv.config();

import { connectMongoDB } from "./src/db/mongo.js";
import { Producer } from "./src/models/producer.model.js";

async function test() {
  try {
    await connectMongoDB();
    const p = await Producer.create({
      name: "testRed",
      userId: "00000000-0000-0000-0000-000000000000",
      imageUrl: null,
      email: "testred@test.com",
      description: "Nuevo productor registrado.",
      category: "otros",
      active: true,
    });
    console.log("Exito:", p);
    await Producer.findByIdAndDelete(p._id);
  } catch (err) {
    console.error("Error MONGO:", err);
  }
  process.exit(0);
}
test();
