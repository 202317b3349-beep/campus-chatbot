import express from "express";
import ChatLog from "../models/ChatLog.js";

const router = express.Router();

// ── Save chat message ─────────────────────────────────
router.post("/log", async (req, res) => {
  try {
    const { sessionId, userMsg, botReply, lang, department } = req.body;
    const log = await ChatLog.create({ sessionId, userMsg, botReply, lang, department });
    res.json({ ok: true, id: log._id });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Save feedback on a message ────────────────────────
router.patch("/:id", async (req, res) => {
  try {
    const { feedback, comment } = req.body;
    await ChatLog.findByIdAndUpdate(req.params.id, { feedback, comment });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Get all logs for admin panel ──────────────────────
router.get("/all", async (req, res) => {
  try {
    const logs = await ChatLog.find().sort({ timestamp: -1 }).limit(500);
    res.json(logs);
  } catch (err) {
    res.status(500).json([]);
  }
});

// ── Download CSV — UTF-8 BOM for Excel Hindi support ──
router.get("/csv", async (req, res) => {
  try {
    const logs = await ChatLog.find().sort({ timestamp: -1 });

    const header = "Session ID,User Message,Bot Reply,Department,Language,Feedback,Comment,Time\n";

    const rows = logs.map(l => {
      const escape = (val) => `"${String(val || "").replace(/"/g, '""')}"`;
      return [
        escape(l.sessionId),
        escape(l.userMsg),
        escape(l.botReply),
        escape(l.department || "General"),
        escape(l.lang === "hi" ? "Hindi" : "English"),
        escape(l.feedback || ""),
        escape(l.comment || ""),
        escape(new Date(l.timestamp).toLocaleString("en-IN")),
      ].join(",");
    }).join("\n");

    // UTF-8 BOM (\uFEFF) — Excel ko Hindi/Unicode sahi dikhane ke liye zaroori
    const BOM = "\uFEFF";
    const csv = BOM + header + rows;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=campusbot_chat_history.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).send("Error generating CSV");
  }
});

export default router;