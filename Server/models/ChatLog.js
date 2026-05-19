import mongoose from "mongoose";

const chatLogSchema = new mongoose.Schema({
  sessionId:  { type: String, required: true },
  userMsg:    { type: String, required: true },
  botReply:   { type: String, required: true },
  department: { type: String, default: "General" },
  lang:       { type: String, default: "en" },
  feedback:   { type: String, default: null },   // "up" | "down" | null
  comment:    { type: String, default: "" },
  timestamp:  { type: Date, default: Date.now },
});

export default mongoose.model("ChatLog", chatLogSchema);