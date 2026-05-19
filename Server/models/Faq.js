import mongoose from "mongoose";

const faqSchema = new mongoose.Schema({
  question: String,
  answer: String,
  department: String,
  keywords: [String],
  chips: [String],  // Added the chips field
});

export default mongoose.model("Faq", faqSchema);
