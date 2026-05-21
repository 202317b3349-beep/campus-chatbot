import express from "express";
import jwt     from "jsonwebtoken";
import User    from "../models/User.js";

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "campusbot_secret_2026";

// ── authMiddleware ────────────────────────────────────────────────
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ── adminMiddleware ───────────────────────────────────────────────
export function adminMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin")
      return res.status(403).json({ error: "Admin only" });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ── POST /api/auth/signup ─────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required" });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET, { expiresIn: "7d" }
    );
    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const ok = await user.comparePassword(password);
    if (!ok)  return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET, { expiresIn: "7d" }
    );
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/users — admin gets all users ────────────────────
router.get("/users", adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/auth/users/:id/role — admin updates role ──────────
router.patch("/users/:id/role", adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role))
      return res.status(400).json({ error: "Role must be 'user' or 'admin'" });

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ error: "User not found" });
    return res.json({ ok: true, user: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;