import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import faqRoutes from "./routes/faqRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/campusbot");
mongoose.connection.once("open", () => {
  console.log("MongoDB connected");
});

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.use("/api/faqs", faqRoutes);

import feedbackRoutes from "./routes/feedbackRoutes.js";
app.use("/api/feedback", feedbackRoutes);

//  TTS route — app.listen se PEHLE hona chahiye
app.get("/api/tts", async (req, res) => {
  const text = req.query.text || "";
  const lang = req.query.lang || "hi";

  if (!text) return res.status(400).send("No text");

  try {
    const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=gtx&ttsspeed=0.9`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer":    "https://translate.google.com/",
        "Accept":     "audio/mpeg, audio/*, */*",
      },
    });

    if (!response.ok) {
      console.error("TTS fetch failed:", response.status);
      return res.status(502).send("TTS upstream error");
    }

    const buffer = await response.arrayBuffer();
    res.set("Content-Type",                "audio/mpeg");
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Cache-Control",               "no-cache");
    res.send(Buffer.from(buffer));

  } catch (err) {
    console.error("TTS error:", err.message);
    res.status(500).send("TTS error");
  }
});

// app.listen SABSE LAST MEIN
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
