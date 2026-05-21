import mongoose from "mongoose";

const fallbackQuerySchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  userName:         { type: String, default: "Guest" },
  userEmail:        { type: String, required: true },
  preferredTime:    { type: String, default: "" },        // e.g. "Morning 9-11 AM"
  query:            { type: String, required: true },
  lang:             { type: String, default: "en" },
  status:           { type: String, enum: ["pending", "replied"], default: "pending" },
  adminReply:       { type: String, default: "" },
  repliedAt:        { type: Date },
  createdAt:        { type: Date, default: Date.now },
});

export default mongoose.model("FallbackQuery", fallbackQuerySchema);