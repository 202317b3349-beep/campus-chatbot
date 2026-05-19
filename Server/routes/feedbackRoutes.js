import express from "express";
import ChatLog from "../models/ChatLog.js";

const router = express.Router();

// ── Save chat message ─────────────────────────────────
// POST /api/feedback/log
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
// PATCH /api/feedback/:id
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
// GET /api/feedback/all
router.get("/all", async (req, res) => {
  try {
    const logs = await ChatLog.find().sort({ timestamp: -1 }).limit(500);
    res.json(logs);
  } catch (err) {
    res.status(500).json([]);
  }
});

// ── Download CSV ──────────────────────────────────────
// GET /api/feedback/csv
router.get("/csv", async (req, res) => {
  try {
    const logs = await ChatLog.find().sort({ timestamp: -1 });
    const header = "Session,User Message,Bot Reply,Department,Language,Feedback,Comment,Time\n";
    const rows = logs.map(l =>
      [
        l.sessionId,
        `"${l.userMsg.replace(/"/g,'""')}"`,
        `"${l.botReply.replace(/"/g,'""')}"`,
        l.department,
        l.lang,
        l.feedback || "",
        `"${(l.comment||"").replace(/"/g,'""')}"`,
        new Date(l.timestamp).toLocaleString(),
      ].join(",")
    ).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=chat_history.csv");
    res.send(header + rows);
  } catch (err) {
    res.status(500).send("Error generating CSV");
  }
});

export default router;