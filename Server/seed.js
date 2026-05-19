// server/seed.js
// Run this once: node seed.js
import mongoose from "mongoose";
import { readFile } from "fs/promises";
import Faq from "./models/Faq.js";

await mongoose.connect("mongodb://127.0.0.1:27017/campusbot");
console.log("MongoDB connected");

const raw = await readFile("./faqs.json", "utf-8");
const data = JSON.parse(raw);

await Faq.deleteMany({});
console.log("Old data deleted");

await Faq.insertMany(data);
console.log(` ${data.length} FAQs inserted successfully!`);

await mongoose.disconnect();
process.exit(0);