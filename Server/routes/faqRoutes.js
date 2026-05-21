// server/routes/faqRoutes.js
import express from "express";
import Faq from "../models/Faq.js";

const router = express.Router();

// ── Translation helper using MyMemory (free, no API key needed) ──
async function translate(text, from, to) {
  try {
    // Primary: MyMemory
    const url  = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const res  = await fetch(url);
    const data = await res.json();
    const result = data.responseData?.translatedText || "";

    // Agar result English jaisa lag raha hai aur Hindi chahiye thi
    if (to === "hi" && result && !/[\u0900-\u097F]/.test(result)) {
      // Hindi characters nahi hain — fallback try karo
      throw new Error("Translation returned English");
    }
    return result || text;
  } catch {
    try {
      // Fallback: Google Translate free endpoint
      const url2 = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
      const res2 = await fetch(url2);
      const data2 = await res2.json();
      return data2?.[0]?.[0]?.[0] || text;
    } catch {
      return text;
    }
  }
}

// ── Score based search ───────────────────────────────────────────
function findBestMatch(allFaqs, query) {
  const q = query.toLowerCase().trim();

  const scored = allFaqs.map((faq) => {
    let score = 0;

    faq.keywords.forEach((kw) => {
      const k = kw.toLowerCase();
      if (q.includes(k))        score += 5;
      if (k.includes(q))        score += 3;
      q.split(" ").forEach(word => {
        if (word.length > 3 && k.includes(word)) score += 2;
      });
    });

    faq.question.toLowerCase().split(" ").forEach(word => {
      if (word.length > 3 && q.includes(word)) score += 1;
    });

    return { faq, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

// ────────────────────────────────────────────────────────────────
// GET /api/faqs/search?q=...&lang=hi|en
// ────────────────────────────────────────────────────────────────
router.get("/search", async (req, res) => {
  try {
    const rawQuery = req.query.q?.trim() || "";
    const lang     = req.query.lang || "en";   // "hi" or "en"

    if (!rawQuery) {
      return res.json({ answer: "Please type a question.", chips: [] });
    }

    // Step 1: If Hindi, translate query → English first
    const englishQuery = lang === "hi"
      ? await translate(rawQuery, "hi", "en")
      : rawQuery;

    console.log(`[Search] original: "${rawQuery}" | english: "${englishQuery}" | lang: ${lang}`);

    // Step 2: Search DB with English query
    const allFaqs = await Faq.find();
    const best    = findBestMatch(allFaqs, englishQuery);

    if (!best || best.score === 0) {
      const noMatch = lang === "hi"
        ? "मुझे इस बारे में पक्का पता नहीं है। कृपया helpdesk@bits-pilani.ac.in पर संपर्क करें 😊"
        : "I'm not sure about that yet. Please contact helpdesk@bits-pilani.ac.in 😊";

      return res.json({
        answer: noMatch,
        chips:  lang === "hi"
          ? ["पुस्तकालय का समय", "प्रवेश प्रक्रिया क्या है?", "पासवर्ड रीसेट कैसे करें?"]
          : ["Library timings", "Admission process", "Reset my password"],
      });
    }

    // Step 3: If Hindi, translate answer → Hindi
    let finalAnswer = best.faq.answer;
    let finalChips  = best.faq.chips || [];

    if (lang === "hi") {
      finalAnswer = await translate(best.faq.answer, "en", "hi");

      // Translate chips to Hindi too
      finalChips = await Promise.all(
        (best.faq.chips || []).map(chip => translate(chip, "en", "hi"))
      );
    }

    return res.json({ answer: finalAnswer, chips: finalChips });

  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ answer: "Server error. Please try again.", chips: [] });
  }
});

// ────────────────────────────────────────────────────────────────
// GET /api/faqs/by-department?dept=Library&lang=hi|en
// ────────────────────────────────────────────────────────────────
router.get("/by-department", async (req, res) => {
  try {
    const dept = req.query.dept?.trim();
    const lang = req.query.lang || "en";

    if (!dept) return res.json([]);

    const faqs = await Faq.find({ department: dept }).select("question -_id");
    let questions = faqs.map(f => f.question);

    // Translate questions to Hindi if needed
    if (lang === "hi") {
      questions = await Promise.all(
        questions.map(q => translate(q, "en", "hi"))
      );
    }

    res.json(questions);
  } catch (err) {
    console.error("Dept error:", err);
    res.status(500).json([]);
  }
});

// ────────────────────────────────────────────────────────────────
// GET /api/faqs/seed  (run once)
// ────────────────────────────────────────────────────────────────
router.get("/seed", async (req, res) => {
  try {
    const { readFile } = await import("fs/promises");
    const { fileURLToPath } = await import("url");
    const { dirname, join } = await import("path");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const raw  = await readFile(join(__dirname, "../faqs.json"), "utf-8");
    const data = JSON.parse(raw);
    await Faq.deleteMany();
    await Faq.insertMany(data);
    res.json({ message: `Seeded ${data.length} FAQs!` });
  } catch (err) {
    res.status(500).json({ message: "Seed failed", error: err.message });
  }
});

export default router;
