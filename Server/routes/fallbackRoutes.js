import express from "express";
import FallbackQuery from "../models/FallbackQuery.js";
import { authMiddleware, adminMiddleware } from "./authRoutes.js";

const router = express.Router();

// ── POST /api/fallback  — user submits an unanswered query ────────
router.post("/", async (req, res) => {
  try {
    const { userEmail, userName, preferredTime, query, lang, userId } = req.body;
    if (!userEmail || !query)
      return res.status(400).json({ error: "Email and query are required" });

    const doc = await FallbackQuery.create({ userId: userId || null, userName, userEmail, preferredTime, query, lang });
    res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/fallback  — admin gets all pending/replied queries ───
router.get("/", adminMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const queries = await FallbackQuery.find(filter).sort({ createdAt: -1 });
    res.json(queries);
  } catch (err) {
    res.status(500).json([]);
  }
});

// ── PATCH /api/fallback/:id/reply  — admin replies ───────────────
router.patch("/:id/reply", adminMiddleware, async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply) return res.status(400).json({ error: "Reply is required" });

    const doc = await FallbackQuery.findByIdAndUpdate(
      req.params.id,
      { adminReply: reply, status: "replied", repliedAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Query not found" });
    res.json({ ok: true, doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/fallback/my  — user sees their own queries ──────────
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const queries = await FallbackQuery.find({ userEmail: req.user.email }).sort({ createdAt: -1 });
    res.json(queries);
  } catch (err) {
    res.status(500).json([]);
  }
});

export default router;