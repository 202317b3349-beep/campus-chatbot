import { useState, useRef, useEffect } from "react";
import AuthPage      from "./AuthPage";
import WelcomeScreen from "./WelcomeScreen";
import AdminPortal   from "./AdminPortal";

const SESSION_ID  = Math.random().toString(36).slice(2);
const departments = [
  { name: "Admissions", icon: "🏛️", color: "#ff6b6b" },
  { name: "Library",    icon: "📚", color: "#6c5ce7" },
  { name: "IT Support", icon: "💻", color: "#00b894" },
  { name: "Academics",  icon: "🎓", color: "#0984e3" },
];

const UI = {
  en: {
    role:"Helpdesk Assistant", online:"Online", navLabel:"NAVIGATION", deptLabel:"DEPARTMENTS",
    about:"About CampusBot", aboutText:"Your AI assistant for all campus queries. Fast, reliable, 24/7.",
    placeholder:"Type your question...", send:"Send ➔", faqTitle:"Frequently Asked Questions",
    contactTitle:"Contact Us", noFaqs:"Click a department to load questions.",
    fallback:"I'm not sure about that. Please contact helpdesk@bits-pilani.ac.in",
    listening:"Listening...", changeLang:"Change Language",
    greeting:"Hi! 👋 How can I help you today?\nI can assist with admissions, library, IT support, academics, and more.",
    initChips:["How do I apply for admission?","Library Timings","Reset my password","Check Attendance"],
    navPages:["Chat","FAQs","Contact"],
    myQueries:"My Queries",
    noQueriesYet:"You haven't submitted any queries yet.",
    queriesTitle:"My Submitted Queries",
    fallbackModalTitle:"Submit Your Query",
    fallbackModalSub:"We couldn't find an answer. Share your details and our team will contact you.",
    fallbackModalQ:"Your question:",
    fallbackModalCustom:"Or describe your issue in detail:",
    fallbackSuccess:"Query Submitted!",
    fallbackSuccessSub:"Our team will contact you soon.",
    submitBtn:"Submit Query →",
    cancelBtn:"Cancel",
    prefTime:"Preferred Contact Time",
    emailLabel:"Email Address",
    pendingLabel:"🟡 Pending",
    repliedLabel:"✅ Replied",
    preferredAt:"Preferred time:",
    adminReply:"Admin Reply:",
    repliedAt:"Replied:",
    continueChatBtn:"Continue Chat →",
    newReplyBadge:"New Reply!",
  },
  hi: {
    role:"Helpdesk Sahayak", online:"Online", navLabel:"NAVIGATION", deptLabel:"VIBHAG",
    about:"CampusBot ke baare mein", aboutText:"Aapka AI assistant — campus ke saare sawaalon ke liye. 24/7 uplabdh.",
    placeholder:"Apna sawaal likhein ya bolein...", send:"Bhejo ➔", faqTitle:"Aam Pooche Jaane Wale Sawaal",
    contactTitle:"Sampark Karein", noFaqs:"Vibhag click karein sawaal load karne ke liye.",
    fallback:"Mujhe is baare mein pakka pata nahi. Kripya helpdesk par sampark karein.",
    listening:"Sun raha hoon...", changeLang:"Bhasha Badlein",
    greeting:"नमस्ते! 👋 मैं आज आपकी किस प्रकार सहायता कर सकता हूँ?\nमैं प्रवेश, पुस्तकालय, आईटी सहायता, शिक्षण‑सम्बन्धी विषयों और अन्य कई मामलों में मदद कर सकता हूँ।",
    initChips:["प्रवेश प्रक्रिया क्या है?","पुस्तकालय का समय","पासवर्ड रीसेट कैसे करें?","उपस्थिति कैसे देखें?"],
    navPages:["Chat","FAQs","Sampark"],
    myQueries:"मेरी Queries",
    noQueriesYet:"आपने अभी तक कोई query submit नहीं की है।",
    queriesTitle:"मेरी Submit की गई Queries",
    fallbackModalTitle:"अपनी Query Submit करें",
    fallbackModalSub:"हम इस सवाल का जवाब नहीं दे पा रहे। अपनी details दें, team आपको contact करेगी।",
    fallbackModalQ:"आपका सवाल:",
    fallbackModalCustom:"या अपनी समस्या विस्तार से लिखें:",
    fallbackSuccess:"Query Submit हो गई!",
    fallbackSuccessSub:"हमारी team जल्द ही आपसे संपर्क करेगी।",
    submitBtn:"Submit करें →",
    cancelBtn:"Cancel",
    prefTime:"Preferred Contact Time",
    emailLabel:"Email Address",
    pendingLabel:"🟡 Pending",
    repliedLabel:"✅ Replied",
    preferredAt:"Preferred time:",
    adminReply:"Admin का जवाब:",
    repliedAt:"जवाब दिया:",
    continueChatBtn:"Chat जारी रखें →",
    newReplyBadge:"नया जवाब!",
  },
};

function formatTime(){return new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});}

function isFallbackResponse(text){
  const l=(text||"").toLowerCase();
  return l.includes("not sure")||l.includes("pakka pata nahi")||l.includes("helpdesk@bits")||l.includes("cannot connect")||l.includes("connect nahi")||l.includes("please contact")||l.includes("sampark karein");
}

// ── TTS — comprehensive clean function ───────────────
function cleanForSpeech(text, lang) {
  let t = text || "";

  // Remove ALL emojis first
  t = t.replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
       .replace(/[\u{2600}-\u{27BF}]/gu, "")
       .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
       .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
       .replace(/[\u{2700}-\u{27BF}]/gu, "");

  // Fix time pronunciations — 08:00 → "eight", 09 → "nine", no leading zero
  t = t.replace(/\b0([1-9])\s*:\s*00\b/g, (_, h) => {
    const words = ["","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"];
    return words[parseInt(h)] || h;
  });
  t = t.replace(/\b0([1-9])\s*:\s*([0-5][0-9])\b/g, (_, h, m) => {
    const words = ["","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"];
    return `${words[parseInt(h)]} ${m === "00" ? "" : m}`.trim();
  });
  // 24hr format
  t = t.replace(/\b([1-9]|1[0-2])\s*:\s*00\b/g, (_, h) => {
    const words = ["","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"];
    return words[parseInt(h)] || h;
  });

  // Acronym pronunciations
  if (lang === "en") {
    t = t.replace(/\bERP\b/g, "E R P")
         .replace(/\bLMS\b/g, "L M S")
         .replace(/\bIT\b/g, "I T")
         .replace(/\bAM\b/g, "A M")
         .replace(/\bPM\b/g, "P M")
         .replace(/\bUG\b/g, "U G")
         .replace(/\bPG\b/g, "P G")
         .replace(/\bID\b/g, "I D")
         .replace(/\bURL\b/g, "U R L")
         .replace(/\bAPI\b/g, "A P I");
  } else {
    t = t.replace(/\bERP\b/g, "ई आर पी")
         .replace(/\bLMS\b/g, "एल एम एस")
         .replace(/\bIT\b/g, "आई टी");
  }

  // Remove markdown, special chars — keep Hindi + English + basic punctuation
  t = t.replace(/[*_`#\[\]]/g, "")
       .replace(/[^\u0900-\u097F\w\s.,?!।:;'-]/g, " ")
       .replace(/\s+/g, " ")
       .trim();

  return t;
}

let currentAudio = null;
function stopSpeech() {
  window.responsiveVoice?.cancel();
  window.speechSynthesis?.cancel();
  if (currentAudio) {
    try { currentAudio.onended=null; currentAudio.onerror=null; currentAudio.pause(); currentAudio.currentTime=0; currentAudio.src=""; currentAudio.load(); } catch(e) {}
    currentAudio = null;
  }
  window._ttsStopFlag = (window._ttsStopFlag || 0) + 1;
}

function speakText(text, lang) {
  const clean = cleanForSpeech(text, lang);
  if (!clean) return;
  stopSpeech();
  if (lang === "hi") {
    const chunks = []; const words = clean.split(" "); let cur = "";
    words.forEach(w => { if ((cur + " " + w).trim().length > 150) { if (cur) chunks.push(cur.trim()); cur = w; } else { cur = (cur + " " + w).trim(); } });
    if (cur) chunks.push(cur.trim());
    let i = 0; const tok = (window._ttsStopFlag || 0);
    const nxt = () => {
      if ((window._ttsStopFlag || 0) !== tok) { currentAudio = null; return; }
      if (i >= chunks.length) { currentAudio = null; return; }
      const a = new Audio(`http://localhost:5000/api/tts?text=${encodeURIComponent(chunks[i++])}&lang=hi`);
      currentAudio = a; a.volume = 1; a.onended = nxt; a.onerror = () => nxt(); a.play().catch(() => {});
    };
    nxt();
  } else {
    if (window.responsiveVoice?.voiceSupport()) {
      window.responsiveVoice.speak(clean, "UK English Female", { rate: 0.92, pitch: 1 });
    } else {
      window.speechSynthesis?.cancel();
      const u = new SpeechSynthesisUtterance(clean); u.lang = "en-US"; u.rate = 0.92; u.pitch = 1;
      const ts = () => { const v = window.speechSynthesis.getVoices(); const e = v.find(x => x.lang.startsWith("en")) || v[0]; if (e) u.voice = e; window.speechSynthesis.speak(u); };
      if (window.speechSynthesis.getVoices().length) ts(); else window.speechSynthesis.onvoiceschanged = ts;
    }
  }
}

function createRecognition(lang) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return null;
  const r = new SR(); r.lang = lang === "hi" ? "hi-IN" : "en-IN"; r.interimResults = false; r.maxAlternatives = 1; return r;
}

function getToken() { return localStorage.getItem("campusbot_token") || ""; }
async function getReplyFromDB(input, lang) {
  try { const r = await fetch(`http://localhost:5000/api/faqs/search?q=${encodeURIComponent(input)}&lang=${lang}`); const d = await r.json(); return { text: d.answer || UI[lang].fallback, chips: d.chips || [] }; }
  catch { return { text: lang === "hi" ? "Server se connect nahi ho pa raha." : "Cannot connect to server. Please start the backend.", chips: [] }; }
}
async function fetchDeptFaqs(dept, lang) {
  try { const r = await fetch(`http://localhost:5000/api/faqs/by-department?dept=${encodeURIComponent(dept)}&lang=${lang}`); return await r.json(); } catch { return []; }
}

// ── FallbackModal ─────────────────────────────────────
function FallbackModal({ query, lang, user, onClose, onSubmitted }) {
  const L = UI[lang] || UI.en;
  const [email, setEmail] = useState(user?.email || "");
  const [pTime, setPTime] = useState("");
  const [customQ, setCustomQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const times = ["Morning (9 AM – 12 PM)", "Afternoon (12 PM – 3 PM)", "Evening (3 PM – 6 PM)", "Anytime"];

  const submit = async () => {
    if (!email) return setErr(lang === "hi" ? "Email required hai" : "Email is required");
    setLoading(true); setErr("");
    const finalQuery = customQ.trim() || query;
    try {
      const r = await fetch("http://localhost:5000/api/fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
        body: JSON.stringify({ userEmail: email, userName: user?.name || "Guest", preferredTime: pTime, query: finalQuery, lang, userId: user?.id || null }),
      });
      if (r.ok) { setDone(true); setTimeout(() => { onSubmitted(); onClose(); }, 2000); }
      else { const d = await r.json(); setErr(d.error || (lang === "hi" ? "Submit nahi hua" : "Submission failed")); }
    } catch { setErr(lang === "hi" ? "Server se connect nahi ho paa raha" : "Cannot connect to server"); }
    setLoading(false);
  };

  return (
    <div style={fm.overlay}>
      <div style={fm.modal}>
        {done ? (
          <div style={fm.success}><div style={fm.successIcon}>✅</div><div style={fm.successTitle}>{L.fallbackSuccess}</div><div style={fm.successSub}>{L.fallbackSuccessSub}</div></div>
        ) : (<>
          <div style={fm.header}>
            <div style={fm.title}>🙋 {L.fallbackModalTitle}</div>
            <div style={fm.sub}>{L.fallbackModalSub}</div>
            <button style={fm.closeBtn} onClick={onClose}>✕</button>
          </div>
          <div style={fm.queryBox}><span style={fm.queryLabel}>{L.fallbackModalQ}</span><span style={fm.queryText}>{query}</span></div>
          <div style={fm.form}>
            <div style={fm.field}><label style={fm.label}>{L.fallbackModalCustom}</label>
              <textarea style={fm.textarea} rows={3} placeholder={lang === "hi" ? "Yahan apni samasya likhein..." : "Describe your issue here..."} value={customQ} onChange={e => setCustomQ(e.target.value)} />
            </div>
            <div style={fm.field}><label style={fm.label}>{L.emailLabel} *</label>
              <input style={fm.input} type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div style={fm.field}><label style={fm.label}>{L.prefTime}</label>
              <div style={fm.timeGrid}>{times.map(t => <button key={t} style={{ ...fm.timeChip, ...(pTime === t ? fm.timeChipActive : {}) }} onClick={() => setPTime(t)}>{t}</button>)}</div>
            </div>
            {err && <div style={fm.error}>⚠️ {err}</div>}
            <div style={fm.btnRow}>
              <button style={fm.cancelBtn} onClick={onClose}>{L.cancelBtn}</button>
              <button style={{ ...fm.submitBtn, ...(loading ? { opacity: .6 } : {}) }} onClick={submit} disabled={loading}>{loading ? "..." : L.submitBtn}</button>
            </div>
          </div>
        </>)}
      </div>
    </div>
  );
}
const fm = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  modal: { background: "#fff", borderRadius: 20, padding: "28px", width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,.2)", maxHeight: "90vh", overflowY: "auto" },
  header: { position: "relative", marginBottom: 16 },
  title: { fontSize: 17, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 },
  sub: { fontSize: 13, color: "#636e72", lineHeight: 1.5, paddingRight: 24 },
  closeBtn: { position: "absolute", top: 0, right: 0, background: "none", border: "none", fontSize: 18, color: "#b2bec3", cursor: "pointer" },
  queryBox: { background: "#f8f9fa", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13 },
  queryLabel: { fontWeight: 600, color: "#6c5ce7", marginRight: 6 },
  queryText: { color: "#2d3436" },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "#636e72" },
  input: { padding: "10px 14px", borderRadius: 10, border: "1.5px solid #eee", fontSize: 14, outline: "none", fontFamily: "inherit" },
  textarea: { padding: "10px 14px", borderRadius: 10, border: "1.5px solid #eee", fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" },
  timeGrid: { display: "flex", flexWrap: "wrap", gap: 7 },
  timeChip: { padding: "6px 12px", borderRadius: 20, border: "1.5px solid #eee", background: "#f8f9fa", fontSize: 12, color: "#636e72", cursor: "pointer" },
  timeChipActive: { borderColor: "#6c5ce7", background: "#f0eeff", color: "#6c5ce7", fontWeight: 600 },
  error: { background: "#fff5f5", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#e17055" },
  btnRow: { display: "flex", gap: 10 },
  cancelBtn: { flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #eee", background: "#fff", color: "#636e72", fontSize: 13, cursor: "pointer" },
  submitBtn: { flex: 2, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6c5ce7,#a29bfe)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  success: { textAlign: "center", padding: "20px 0" },
  successIcon: { fontSize: 48, marginBottom: 12 },
  successTitle: { fontSize: 17, fontWeight: 700, color: "#2d3436", marginBottom: 6 },
  successSub: { fontSize: 13, color: "#636e72" },
};

// ── MyQueriesPanel — with notification + continue chat ──
function MyQueriesPanel({ lang, onContinueChat, seenReplies, markSeen }) {
  const L = UI[lang] || UI.en;
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      fetch("http://localhost:5000/api/fallback/my", { headers: { Authorization: `Bearer ${getToken()}` } })
        .then(r => r.json()).then(d => { setQueries(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
    };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const newReplies = queries.filter(q => q.status === "replied" && !seenReplies[q._id]);

  if (loading) return <div style={{ padding: 24, color: "#b2bec3" }}>Loading...</div>;

  return (
    <div style={s.staticPage}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <h2 style={{ ...s.pageTitle, margin: 0 }}>📩 {L.queriesTitle}</h2>
        {newReplies.length > 0 && (
          <span style={mqS.notifBadge}>{newReplies.length} {L.newReplyBadge}</span>
        )}
      </div>

      {!queries.length ? (
        <p style={{ color: "#b2bec3" }}>{L.noQueriesYet}</p>
      ) : queries.map(q => {
        const isNew = q.status === "replied" && !seenReplies[q._id];
        return (
          <div key={q._id} style={{ ...mqS.card, ...(q.status === "replied" ? mqS.cardReplied : {}), ...(isNew ? mqS.cardNew : {}) }}>
            {/* Status timeline */}
            <div style={mqS.timeline}>
              <div style={{ ...mqS.timelineDot, ...(q.status === "replied" ? mqS.dotDone : mqS.dotPending) }}/>
              <div style={mqS.timelineLine}/>
              <div style={{ ...mqS.timelineDot, ...(q.status === "replied" ? mqS.dotDone : mqS.dotInactive) }}/>
            </div>

            <div style={mqS.cardBody}>
              <div style={mqS.meta}>
                <span style={{ ...mqS.badge, ...(q.status === "replied" ? mqS.badgeReplied : mqS.badgePending) }}>
                  {q.status === "replied" ? L.repliedLabel : L.pendingLabel}
                </span>
                {isNew && <span style={mqS.newBadge}>🔔 {L.newReplyBadge}</span>}
                <span style={mqS.time}>{new Date(q.createdAt).toLocaleString()}</span>
              </div>

              <div style={mqS.queryText}>"{q.query}"</div>
              {q.preferredTime && <div style={mqS.prefTime}>⏰ {L.preferredAt} {q.preferredTime}</div>}

              {/* Status steps */}
              <div style={mqS.steps}>
                <div style={mqS.step}><span style={mqS.stepDot}>●</span> Query received</div>
                <div style={{ ...mqS.step, opacity: q.status === "replied" ? 1 : 0.4 }}>
                  <span style={{ ...mqS.stepDot, color: q.status === "replied" ? "#00b894" : "#b2bec3" }}>●</span>
                  {q.status === "replied" ? "Response received" : "Awaiting response..."}
                </div>
              </div>

              {q.status === "replied" && q.adminReply && (
                <div style={mqS.replyBox}>
                  <div style={mqS.replyLabel}>💬 {L.adminReply}</div>
                  <div style={mqS.replyText}>{q.adminReply}</div>
                  <div style={mqS.replyTime}>{L.repliedAt} {new Date(q.repliedAt).toLocaleString()}</div>
                  <button style={mqS.continueChatBtn} onClick={() => {
                    markSeen(q._id);
                    onContinueChat(q.query, q.adminReply);
                  }}>
                    {L.continueChatBtn}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
const mqS = {
  notifBadge: { background: "#e17055", color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 },
  card: { background: "#fff", borderRadius: 14, padding: "16px 18px", marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,.07)", borderLeft: "4px solid #fdcb6e", display: "flex", gap: 12 },
  cardReplied: { borderLeftColor: "#00b894", background: "#f8fffc" },
  cardNew: { borderLeftColor: "#6c5ce7", boxShadow: "0 4px 20px rgba(108,92,231,.15)" },
  timeline: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingTop: 4 },
  timelineDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  timelineLine: { width: 2, flex: 1, background: "#eee", minHeight: 20 },
  dotDone: { background: "#00b894" },
  dotPending: { background: "#fdcb6e" },
  dotInactive: { background: "#ddd" },
  cardBody: { flex: 1 },
  meta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  badge: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  badgePending: { background: "#fff8ec", color: "#e67e22", border: "1px solid #fde8c0" },
  badgeReplied: { background: "#ecfdf5", color: "#00b894", border: "1px solid #bbf7d0" },
  newBadge: { fontSize: 11, fontWeight: 700, background: "#f0eeff", color: "#6c5ce7", border: "1px solid #d0c8ff", borderRadius: 20, padding: "3px 10px" },
  time: { fontSize: 11, color: "#b2bec3", marginLeft: "auto" },
  queryText: { fontSize: 14, color: "#2d3436", fontStyle: "italic", marginBottom: 8, lineHeight: 1.5 },
  prefTime: { fontSize: 12, color: "#636e72", marginBottom: 8 },
  steps: { display: "flex", gap: 16, marginBottom: 10 },
  step: { fontSize: 11, color: "#636e72", display: "flex", alignItems: "center", gap: 4 },
  stepDot: { fontSize: 8, color: "#fdcb6e" },
  replyBox: { background: "#f0f9ff", borderRadius: 10, padding: "12px 14px", borderLeft: "3px solid #0984e3" },
  replyLabel: { fontSize: 11, fontWeight: 700, color: "#0984e3", marginBottom: 4 },
  replyText: { fontSize: 13, color: "#2d3436", lineHeight: 1.6, marginBottom: 6 },
  replyTime: { fontSize: 11, color: "#b2bec3", marginBottom: 10 },
  continueChatBtn: { padding: "7px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6c5ce7,#a29bfe)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" },
};

// ── LangSelector ──────────────────────────────────────
function LangSelector({ onSelect }) {
  return (
    <div style={ls.wrap}>
      <div style={ls.avatar}>
        <img src="/bits-logo.png" alt="BITS" style={{ width: 20, height: 20, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
      </div>
      <div style={ls.card}>
        <div style={ls.title}>Welcome to CampusBot!</div>
        <div style={ls.sub}>Please choose your preferred language:</div>
        <div style={ls.btnRow}>
          <button style={ls.btnHi} onClick={() => onSelect("hi")}>🇮🇳 Hindi<span style={ls.hint}>हिंदी में बात करें</span></button>
          <button style={ls.btnEn} onClick={() => onSelect("en")}>🌐 English<span style={ls.hint}>Chat in English</span></button>
        </div>
      </div>
    </div>
  );
}
const ls = {
  wrap: { display: "flex", gap: 10, alignItems: "flex-start" },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "#fff", border: "2px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,42,107,.1)" },
  card: { background: "#fff", borderRadius: "4px 18px 18px 18px", padding: "16px 18px", boxShadow: "0 2px 10px rgba(108,92,231,.13)", maxWidth: 320 },
  title: { fontWeight: 700, fontSize: 15, color: "#2d3436", marginBottom: 6 },
  sub: { fontSize: 13, color: "#636e72", marginBottom: 14, lineHeight: 1.5 },
  btnRow: { display: "flex", gap: 10 },
  btnHi: { flex: 1, padding: "10px 12px", borderRadius: 12, border: "2px solid #6c5ce7", background: "linear-gradient(135deg,#6c5ce7,#a29bfe)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 },
  btnEn: { flex: 1, padding: "10px 12px", borderRadius: 12, border: "2px solid #6c5ce7", background: "#fff", color: "#6c5ce7", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 },
  hint: { fontSize: 10, fontWeight: 400, opacity: .7 },
};

// ── MAIN APP ──────────────────────────────────────────
export default function App() {
  const savedUser = (() => { try { return JSON.parse(localStorage.getItem("campusbot_user")); } catch { return null; } })();
  const [authUser, setAuthUser] = useState(savedUser);
  const [showWelcome, setShowWelcome] = useState(false);
  const [seenReplies, setSeenReplies] = useState(() => { try { return JSON.parse(localStorage.getItem("campusbot_seen_replies") || "{}"); } catch { return {}; } });
  const [pendingQueryCount, setPendingQueryCount] = useState(0);

  const [lang, setLang] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [activePage, setActivePage] = useState("Chat");
  const [activeDept, setActiveDept] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [deptFaqs, setDeptFaqs] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [msgIds, setMsgIds] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [fbComment, setFbComment] = useState({});
  const [fbOpen, setFbOpen] = useState(null);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [sessions, setSessions] = useState(() => { try { return JSON.parse(localStorage.getItem("campusbot_sessions") || "[]"); } catch { return []; } });
  const [activeSession, setActiveSession] = useState(SESSION_ID);
  const [contextMenu, setContextMenu] = useState(null);
  const [fallbackModal, setFallbackModal] = useState(null);

  const bottomRef = useRef(null);
  const recRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  // Poll for new replies notification
  useEffect(() => {
    if (!authUser || authUser.role === "admin") return;
    const check = () => {
      fetch("http://localhost:5000/api/fallback/my", { headers: { Authorization: `Bearer ${getToken()}` } })
        .then(r => r.json()).then(d => {
          if (!Array.isArray(d)) return;
          const newCount = d.filter(q => q.status === "replied" && !seenReplies[q._id]).length;
          setPendingQueryCount(newCount);
        }).catch(() => {});
    };
    check();
    const t = setInterval(check, 20000);
    return () => clearInterval(t);
  }, [authUser, seenReplies]);

  const markSeen = (id) => {
    setSeenReplies(prev => {
      const updated = { ...prev, [id]: true };
      localStorage.setItem("campusbot_seen_replies", JSON.stringify(updated));
      return updated;
    });
  };

  const doLogout = () => {
    localStorage.removeItem("campusbot_token");
    localStorage.removeItem("campusbot_user");
    localStorage.removeItem("campusbot_sessions");
    setAuthUser(null); setShowWelcome(false); setMessages([]); setLang(null); setSessions([]);
  };

  if (!authUser) return <AuthPage onAuth={user => { setAuthUser(user); setShowWelcome(true); }} />;
  if (showWelcome) return <WelcomeScreen user={authUser} onEnter={() => { setShowWelcome(false); }} />;
  if (authUser.role === "admin") return <AdminPortal user={authUser} onLogout={doLogout} />;

  const L = lang ? UI[lang] : UI.en;
  const navKeys = ["Chat", "FAQs", "Contact"];

  const handleLangSelect = (chosen) => {
    setLang(chosen); setDeptFaqs({});
    setMessages([{ from: "bot", text: UI[chosen].greeting, chips: UI[chosen].initChips, time: formatTime() }]);
  };

  // Continue chat from My Queries reply
  const handleContinueChat = (originalQuery, adminReply) => {
    setActivePage("Chat");
    if (!lang) setLang("en");
    const continueMsg = `Regarding my earlier query: "${originalQuery}"\n\nAdmin replied: ${adminReply}\n\nI have a follow-up question.`;
    setMessages(prev => [
      ...prev,
      { from: "bot", text: `Admin replied to your query:\n\n"${adminReply}"\n\nDo you have any follow-up questions?`, chips: [], time: formatTime() }
    ]);
  };

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || !lang) return;
    stopSpeech(); setSpeakingIdx(null); setInput(""); setActivePage("Chat");
    setMessages(prev => [...prev, { from: "user", text: userText, time: formatTime() }]);
    setIsTyping(true);
    setTimeout(async () => {
      const reply = await getReplyFromDB(userText, lang);
      setIsTyping(false);
      let logId = null;
      try {
        const lr = await fetch("http://localhost:5000/api/feedback/log", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ sessionId: SESSION_ID, userMsg: userText, botReply: reply.text, lang, department: "General" }) });
        const ld = await lr.json(); logId = ld.id;
      } catch {}
      if (isFallbackResponse(reply.text)) setTimeout(() => setFallbackModal({ query: userText, lang }), 600);
      setMessages(prev => {
        const updated = [...prev, { from: "bot", text: reply.text, chips: reply.chips, time: formatTime() }];
        const fum = updated.find(m => m.from === "user");
        if (fum) {
          setSessions(prev => {
            const ex = prev.find(x => x.id === activeSession);
            let ns = ex ? prev.map(x => x.id === activeSession ? { ...x, messages: updated, lastMsg: fum.text, time: formatTime() } : x) : [{ id: activeSession, messages: updated, lastMsg: fum.text, time: formatTime(), lang }, ...prev].slice(0, 10);
            localStorage.setItem("campusbot_sessions", JSON.stringify(ns)); return ns;
          });
        }
        if (logId) setMsgIds(p => ({ ...p, [updated.length - 1]: logId }));
        if (ttsEnabled) { setTimeout(() => speakText(reply.text, lang), 200); setSpeakingIdx(updated.length - 1); }
        return updated;
      });
    }, 900);
  };

  const handleSpeakMsg = (text, idx) => {
    if (speakingIdx === idx) { stopSpeech(); setSpeakingIdx(null); }
    else { stopSpeech(); speakText(text, lang); setSpeakingIdx(idx); }
  };

  const toggleListening = () => {
    if (isListening) { recRef.current?.stop(); setIsListening(false); return; }
    const rec = createRecognition(lang);
    if (!rec) { alert("Please use Chrome for speech recognition."); return; }
    recRef.current = rec; rec.start(); setIsListening(true);
    rec.onresult = e => { setInput(e.results[0][0].transcript); setIsListening(false); };
    rec.onerror = () => setIsListening(false); rec.onend = () => setIsListening(false);
  };

  const handleDeptClick = async (dept) => {
    setActiveDept(dept); setActivePage("FAQs");
    const key = `${dept}_${lang}`;
    if (!deptFaqs[key]) { const qs = await fetchDeptFaqs(dept, lang || "en"); setDeptFaqs(prev => ({ ...prev, [key]: qs })); }
  };

  return (
    <div style={s.page} onClick={() => contextMenu && setContextMenu(null)}>
      <style>{`
        @keyframes blink{0%,100%{opacity:.2}50%{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes ripple{0%{box-shadow:0 0 0 0 rgba(239,83,80,.5)}100%{box-shadow:0 0 0 12px rgba(239,83,80,0)}}
        @keyframes speakPulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes notifPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}
        button{cursor:pointer;}button:hover{opacity:.88;}*{box-sizing:border-box;}
      `}</style>

      {fallbackModal && <FallbackModal query={fallbackModal.query} lang={fallbackModal.lang} user={authUser} onClose={() => setFallbackModal(null)} onSubmitted={() => {}} />}

      {/* SIDEBAR — single BITS logo, no robot avatar */}
      <div style={s.sidebar}>
        <div style={s.sidebarTop}>
          {/* BITS logo + name — single, clean */}
          <div style={s.sidebarBrand}>
            <div style={s.sidebarLogoCircle}>
              <img src="/bits-logo.png" alt="BITS" style={s.sidebarLogoImg} onError={e => { e.target.style.display = "none"; }} />
            </div>
            <div>
              <div style={s.sidebarBrandName}>BITS Pilani</div>
              <div style={s.sidebarBrandBot}>CampusBot · Helpdesk</div>
            </div>
          </div>

          <div style={s.onlinePill}><span style={s.greenDot} /> Online &amp; Ready to Help</div>

          {/* User badge */}
          <div style={s.userBadge}>
            <span style={s.userAvatar}>{authUser.name?.[0]?.toUpperCase() || "U"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.userName}>{authUser.name}</div>
              <div style={s.userEmail}>{authUser.email}</div>
            </div>
            <button style={s.logoutBtn} onClick={doLogout}>Sign Out</button>
          </div>

          <div style={s.ttsRow}>
            <span style={s.ttsLabel}>🔊 Auto-speak</span>
            <div style={{ ...s.toggle, ...(ttsEnabled ? s.toggleOn : {}) }} onClick={() => setTtsEnabled(p => !p)}>
              <div style={{ ...s.toggleThumb, ...(ttsEnabled ? s.toggleThumbOn : {}) }} />
            </div>
          </div>

          {lang && <button style={s.langBadge} onClick={() => { stopSpeech(); setLang(null); setMessages([]); }}>{lang === "hi" ? "🇮🇳 Hindi" : "🌐 English"} · {L.changeLang}</button>}

          <div style={s.navLabel}>{L.navLabel}</div>
          {L.navPages.map((page, i) => (
            <button key={navKeys[i]} onClick={() => setActivePage(navKeys[i])} style={{ ...s.navBtn, ...(activePage === navKeys[i] ? s.navBtnActive : {}) }}>
              <span>{navKeys[i] === "Chat" ? "💬" : navKeys[i] === "FAQs" ? "❓" : "📞"}</span>{page}
            </button>
          ))}
          {/* My Queries with notification badge */}
          <button onClick={() => { setActivePage("MyQueries"); }} style={{ ...s.navBtn, ...(activePage === "MyQueries" ? s.navBtnActive : {}), position: "relative" }}>
            <span>📩</span>{L.myQueries}
            {pendingQueryCount > 0 && (
              <span style={s.notifDot}>{pendingQueryCount}</span>
            )}
          </button>

          {sessions.length > 0 && (<>
            <div style={s.navLabel}>RECENT CHATS</div>
            {contextMenu && (
              <div style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x, background: "#fff", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,.15)", border: "1px solid #eee", zIndex: 9999, minWidth: 160, overflow: "hidden" }} onMouseLeave={() => setContextMenu(null)}>
                <div style={{ padding: "6px 0" }}>
                  <button style={s.ctxBtn} onClick={() => { const sess = sessions.find(x => x.id === contextMenu.sessId); if (sess) { setActiveSession(sess.id); setMessages(sess.messages); if (sess.lang) setLang(sess.lang); setActivePage("Chat"); } setContextMenu(null); }}>💬 Open Chat</button>
                  <div style={{ height: 1, background: "#f0f0f0", margin: "4px 0" }} />
                  <button style={{ ...s.ctxBtn, color: "#e17055" }} onClick={() => { setSessions(prev => { const u = prev.filter(x => x.id !== contextMenu.sessId); localStorage.setItem("campusbot_sessions", JSON.stringify(u)); if (activeSession === contextMenu.sessId) { const nid = Math.random().toString(36).slice(2); setActiveSession(nid); setMessages([{ from: "bot", text: lang ? UI[lang].greeting : UI.en.greeting, chips: lang ? UI[lang].initChips : UI.en.initChips, time: formatTime() }]); } return u; }); setContextMenu(null); }}>🗑️ Delete Chat</button>
                  <button style={{ ...s.ctxBtn, color: "#e17055" }} onClick={() => { setSessions([]); localStorage.removeItem("campusbot_sessions"); setMessages([{ from: "bot", text: lang ? UI[lang].greeting : UI.en.greeting, chips: lang ? UI[lang].initChips : UI.en.initChips, time: formatTime() }]); setContextMenu(null); }}>🧹 Clear All</button>
                </div>
              </div>
            )}
            {sessions.slice(0, 10).map(sess => (
              <button key={sess.id} onClick={() => { setActiveSession(sess.id); setMessages(sess.messages); if (sess.lang) setLang(sess.lang); setActivePage("Chat"); }} onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, sessId: sess.id }); }} style={{ ...s.recentBtn, ...(activeSession === sess.id ? s.recentBtnActive : {}) }}>
                <div style={s.recentIcon}>{sess.lang === "hi" ? "🇮🇳" : "💬"}</div>
                <div style={s.recentText}><div style={s.recentMsg}>{sess.lastMsg?.slice(0, 22)}{sess.lastMsg?.length > 22 ? "…" : ""}</div><div style={s.recentTime}>{sess.time}</div></div>
                {activeSession === sess.id && <div style={s.recentDot} />}
              </button>
            ))}
            <button style={s.newChatBtn} onClick={() => { const nid = Math.random().toString(36).slice(2); setActiveSession(nid); setMessages([{ from: "bot", text: lang ? UI[lang].greeting : UI.en.greeting, chips: lang ? UI[lang].initChips : UI.en.initChips, time: formatTime() }]); setActivePage("Chat"); }}>✚ New Chat</button>
          </>)}

          <div style={s.navLabel}>{L.deptLabel}</div>
          {departments.map(d => (
            <button key={d.name} onClick={() => handleDeptClick(d.name)} style={{ ...s.deptBtn, ...(activeDept === d.name && activePage === "FAQs" ? s.deptBtnActive : {}) }}>
              <span style={{ ...s.deptIcon, background: d.color + "22", color: d.color }}>{d.icon}</span>{d.name}
            </button>
          ))}
        </div>
        <div style={s.sidebarBottom}>
          <div style={s.aboutBox}><div style={s.aboutTitle}>{L.about}</div><div style={s.aboutText}>{L.aboutText}</div></div>
        </div>
      </div>

      {/* MAIN */}
      <div style={s.main}>
        {activePage === "Chat" && (<>
          <div style={s.hero}>
            <div style={s.heroOverlay}>
              <img src="/bits-logo.png" alt="BITS" style={s.heroLogo} onError={e => { e.target.style.display = "none"; }} />
              <div style={s.heroTitle}>Campus Helpdesk Chatbot</div>
              <div style={s.heroSub}>Your one-stop solution for campus information and support</div>
            </div>
            <div style={s.heroBadge}>Online &amp; Ready to Help</div>
          </div>
          <div style={s.chatArea}>
            {!lang && <LangSelector onSelect={handleLangSelect} />}
            {messages.map((msg, i) => (
              <div key={i} style={{ animation: "fadeUp 0.3s ease", ...(msg.from === "bot" ? s.botRow : s.userRow) }}>
                {msg.from === "bot" && (
                  <div style={s.botAvatarWrap}>
                    <img src="/bits-logo.png" alt="BITS" style={s.botAvatarImg} onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                    <div style={{ ...s.botAvatarFallback, display: "none" }}>🤖</div>
                  </div>
                )}
                <div style={msg.from === "bot" ? s.botMsgWrap : s.userMsgWrap}>
                  <div style={msg.from === "bot" ? s.botBubble : s.userBubble}>
                    {msg.text.split("\n").map((line, j) => <span key={j}>{line}{j < msg.text.split("\n").length - 1 && <br />}</span>)}
                  </div>
                  {msg.from === "bot" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={s.metaRow}>
                        <button style={{ ...s.speakBtn, ...(speakingIdx === i ? s.speakBtnActive : {}) }} onClick={() => handleSpeakMsg(msg.text, i)}>{speakingIdx === i ? "⏹" : "🔊"}</button>
                        <span style={s.timeLeft}>{msg.time}</span>
                        {msgIds[i] && (
                          <div style={{ display: "flex", gap: 4, marginLeft: 6 }}>
                            <button style={{ ...s.fbBtn, ...(feedbacks[i] === "up" ? s.fbUp : {}) }} onClick={async () => { setFeedbacks(p => ({ ...p, [i]: "up" })); setFbOpen(i); await fetch(`http://localhost:5000/api/feedback/${msgIds[i]}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feedback: "up" }) }); }}>👍</button>
                            <button style={{ ...s.fbBtn, ...(feedbacks[i] === "down" ? s.fbDown : {}) }} onClick={async () => { setFeedbacks(p => ({ ...p, [i]: "down" })); setFbOpen(i); await fetch(`http://localhost:5000/api/feedback/${msgIds[i]}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feedback: "down" }) }); const uq = messages[i - 1]?.text || ""; setTimeout(() => setFallbackModal({ query: uq, lang }), 400); }}>👎</button>
                          </div>
                        )}
                        {isFallbackResponse(msg.text) && (
                          <button style={s.fallbackBtn} onClick={() => { const uq = messages[i - 1]?.text || ""; setFallbackModal({ query: uq, lang }); }}>📩 Submit Query</button>
                        )}
                      </div>
                      {fbOpen === i && msgIds[i] && (
                        <div style={s.fbCommentBox}>
                          <input style={s.fbInput} placeholder="Optional comment..." value={fbComment[i] || ""} onChange={e => setFbComment(p => ({ ...p, [i]: e.target.value }))} />
                          <button style={s.fbSubmit} onClick={async () => { await fetch(`http://localhost:5000/api/feedback/${msgIds[i]}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feedback: feedbacks[i], comment: fbComment[i] || "" }) }); setFbOpen(null); }}>Save</button>
                        </div>
                      )}
                    </div>
                  )}
                  {msg.from === "user" && <div style={s.timeRight}>{msg.time} ✓✓</div>}
                  {msg.chips?.length > 0 && <div style={s.chipsRow}>{msg.chips.map((chip, j) => <button key={j} style={s.chip} onClick={() => sendMessage(chip)}>{chip}</button>)}</div>}
                </div>
              </div>
            ))}
            {isTyping && <div style={s.botRow}><div style={s.botAvatarWrap}><img src="/bits-logo.png" alt="" style={s.botAvatarImg} onError={e=>{e.target.style.display="none";}}/></div><div style={s.botBubble}><span style={s.dot1}>●</span><span style={s.dot2}>●</span><span style={s.dot3}>●</span></div></div>}
            <div ref={bottomRef} />
          </div>
          <div style={s.inputBar}>
            <button style={{ ...s.micBtn, ...(isListening ? s.micActive : {}) }} onClick={toggleListening} disabled={!lang}>{isListening ? "⏹" : "🎤"}</button>
            <input style={s.input} placeholder={isListening ? L.listening : L.placeholder} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} disabled={!lang} />
            <button style={{ ...s.sendBtn, ...(!lang ? s.sendDisabled : {}) }} onClick={() => sendMessage()}>{L.send}</button>
          </div>
        </>)}

        {activePage === "FAQs" && (
          <div style={s.staticPage}>
            <h2 style={s.pageTitle}>{L.faqTitle}</h2>
            {departments.map(d => { const key = `${d.name}_${lang}`; return (
              <div key={d.name} style={{ marginBottom: 28 }}>
                <div style={s.faqDeptTitle}>{d.icon} {d.name}</div>
                {(deptFaqs[key] || []).map((q, i) => <button key={i} style={s.faqItem} onClick={() => sendMessage(q)}>❓ {q}</button>)}
                {!deptFaqs[key] && <div style={{ fontSize: 13, color: "#b2bec3", padding: "6px 2px" }}>{L.noFaqs}</div>}
              </div>
            ); })}
          </div>
        )}

        {activePage === "MyQueries" && (
          <MyQueriesPanel
            lang={lang || "en"}
            onContinueChat={handleContinueChat}
            seenReplies={seenReplies}
            markSeen={markSeen}
          />
        )}

        {activePage === "Contact" && (
          <div style={s.staticPage}>
            <h2 style={s.pageTitle}>{L.contactTitle}</h2>
            {[{ dept: "🏛️ Admissions", email: "admissions@bits-pilani.ac.in", phone: "+91-1596-242192" }, { dept: "📚 Library", email: "library@bits-pilani.ac.in", phone: "+91-1596-242210" }, { dept: "💻 IT Support", email: "ithelp@bits-pilani.ac.in", phone: "+91-1596-242220" }, { dept: "🎓 Academics", email: "academics@bits-pilani.ac.in", phone: "+91-1596-242200" }].map((c, i) => (
              <div key={i} style={s.contactCard}><div style={s.contactDept}>{c.dept}</div><div style={s.contactInfo}>📧 {c.email}</div><div style={s.contactInfo}>📞 {c.phone}</div></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", height: "100vh", fontFamily: "'Segoe UI',sans-serif", background: "#f0f2f5", overflow: "hidden" },
  sidebar: { width: 245, background: "#fff", borderRight: "1px solid #eee", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0 },
  sidebarTop: { padding: "14px 14px", overflowY: "auto" },

  // Single clean brand row
  sidebarBrand: { display: "flex", alignItems: "center", gap: 10, padding: "4px 2px 14px", borderBottom: "1px solid #f0f0f0", marginBottom: 12 },
  sidebarLogoCircle: { width: 38, height: 38, borderRadius: "50%", background: "#f0f4f8", border: "2px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
  sidebarLogoImg: { width: 30, height: 30, objectFit: "contain" },
  sidebarBrandName: { fontSize: 12, fontWeight: 700, color: "#001a4d", letterSpacing: .3 },
  sidebarBrandBot: { fontSize: 9, color: "#b2bec3", letterSpacing: .2 },

  onlinePill: { display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#00b894", fontWeight: 600, background: "#ecfdf5", borderRadius: 20, padding: "3px 10px", marginBottom: 10, width: "fit-content" },
  greenDot: { width: 6, height: 6, borderRadius: "50%", background: "#00b894", display: "inline-block", animation: "pulse 2s infinite" },

  userBadge: { display: "flex", alignItems: "center", gap: 8, background: "#f8f9fa", borderRadius: 10, padding: "8px 10px", marginBottom: 8 },
  userAvatar: { width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#003f7f,#0057b3)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 },
  userName: { fontSize: 12, fontWeight: 600, color: "#2d3436", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  userEmail: { fontSize: 9, color: "#b2bec3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  logoutBtn: { background: "none", border: "1px solid #eee", borderRadius: 6, fontSize: 9, color: "#e17055", cursor: "pointer", padding: "3px 6px", flexShrink: 0, fontWeight: 600 },

  ttsRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 4px", marginBottom: 5 },
  ttsLabel: { fontSize: 11, color: "#636e72" },
  toggle: { width: 34, height: 18, borderRadius: 9, background: "#dfe6e9", position: "relative", cursor: "pointer", transition: "background .2s" },
  toggleOn: { background: "#6c5ce7" },
  toggleThumb: { position: "absolute", top: 2, left: 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" },
  toggleThumbOn: { left: 18 },
  langBadge: { fontSize: 10, color: "#6c5ce7", fontWeight: 600, background: "#f0eeff", borderRadius: 8, padding: "4px 10px", marginBottom: 8, border: "none", display: "block", width: "100%", textAlign: "left" },
  navLabel: { fontSize: 9, fontWeight: 700, color: "#b2bec3", letterSpacing: 1, marginTop: 10, marginBottom: 4 },
  navBtn: { display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 10, border: "none", background: "transparent", fontSize: 12, color: "#636e72", fontWeight: 500, marginBottom: 2, textAlign: "left" },
  navBtnActive: { background: "#f0eeff", color: "#6c5ce7", fontWeight: 700 },
  notifDot: { marginLeft: "auto", background: "#e17055", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, animation: "notifPulse 2s infinite" },
  deptBtn: { display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 10px", borderRadius: 10, border: "none", background: "transparent", fontSize: 12, color: "#636e72", marginBottom: 2, textAlign: "left" },
  deptBtnActive: { background: "#f0eeff", color: "#6c5ce7" },
  deptIcon: { width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 },
  sidebarBottom: { padding: "12px" },
  aboutBox: { background: "#f8f9fa", borderRadius: 10, padding: "10px 12px" },
  aboutTitle: { fontWeight: 600, fontSize: 11, color: "#2d3436", marginBottom: 3 },
  aboutText: { fontSize: 10, color: "#636e72", lineHeight: 1.5 },

  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  hero: { position: "relative", height: 140, background: "linear-gradient(135deg,#001a4d,#003f9e)", flexShrink: 0, backgroundImage: "url('/campus.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundBlendMode: "overlay" },
  heroOverlay: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,26,77,.72)", gap: 3 },
  heroLogo: { width: 38, height: 38, objectFit: "contain", marginBottom: 2, filter: "drop-shadow(0 2px 8px rgba(0,0,0,.5))" },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: 700 },
  heroSub: { color: "rgba(255,255,255,.85)", fontSize: 11, marginTop: 1 },
  heroBadge: { position: "absolute", top: 10, right: 14, background: "#fff", borderRadius: 20, padding: "4px 11px", fontSize: 11, fontWeight: 600, color: "#00b894", boxShadow: "0 2px 8px rgba(0,0,0,.1)" },

  chatArea: { flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 14, background: "linear-gradient(rgba(248,249,250,.92),rgba(248,249,250,.92)),url('/bits-logo.png') center/160px no-repeat" },

  botRow: { display: "flex", gap: 10, alignItems: "flex-start" },
  userRow: { display: "flex", justifyContent: "flex-end" },

  // BITS logo as bot avatar — no robot
  botAvatarWrap: { width: 32, height: 32, borderRadius: "50%", background: "#fff", border: "2px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", boxShadow: "0 2px 6px rgba(0,42,107,.1)" },
  botAvatarImg: { width: 24, height: 24, objectFit: "contain" },
  botAvatarFallback: { width: 24, height: 24, alignItems: "center", justifyContent: "center", fontSize: 14 },

  botMsgWrap: { maxWidth: "62%", display: "flex", flexDirection: "column", gap: 2 },
  userMsgWrap: { maxWidth: "62%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 },
  botBubble: { background: "#fff", color: "#2d3436", padding: "12px 16px", borderRadius: "4px 16px 16px 16px", fontSize: 14, lineHeight: 1.65, boxShadow: "0 1px 4px rgba(0,0,0,.07)" },
  userBubble: { background: "linear-gradient(135deg,#6c5ce7,#a29bfe)", color: "#fff", padding: "12px 16px", borderRadius: "16px 4px 16px 16px", fontSize: 14, lineHeight: 1.65 },
  metaRow: { display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" },
  speakBtn: { background: "none", border: "1px solid #eee", borderRadius: 6, fontSize: 12, color: "#b2bec3", padding: "2px 6px", lineHeight: 1, transition: "all .2s" },
  speakBtnActive: { color: "#6c5ce7", borderColor: "#6c5ce7", animation: "speakPulse 1s infinite" },
  fallbackBtn: { padding: "3px 10px", borderRadius: 20, border: "1.5px solid #e17055", background: "#fff5f5", color: "#e17055", fontSize: 11, fontWeight: 600, cursor: "pointer" },
  timeLeft: { fontSize: 11, color: "#b2bec3" },
  timeRight: { fontSize: 11, color: "#b2bec3", paddingRight: 2, textAlign: "right", marginTop: 2 },
  chipsRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 5 },
  chip: { padding: "6px 14px", borderRadius: 20, border: "1.5px solid #6c5ce7", background: "#fff", color: "#6c5ce7", fontSize: 12, fontWeight: 500 },
  dot1: { fontSize: 10, color: "#b2bec3", animation: "blink 1s infinite", marginRight: 2, animationDelay: "0s" },
  dot2: { fontSize: 10, color: "#b2bec3", animation: "blink 1s infinite", marginRight: 2, animationDelay: ".2s" },
  dot3: { fontSize: 10, color: "#b2bec3", animation: "blink 1s infinite", animationDelay: ".4s" },
  inputBar: { display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", background: "#fff", borderTop: "1px solid #eee", flexShrink: 0 },
  micBtn: { width: 38, height: 38, borderRadius: "50%", border: "2px solid #eee", background: "#f8f9fa", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" },
  micActive: { background: "#fff0f0", borderColor: "#ef5350", animation: "ripple 1s infinite" },
  input: { flex: 1, padding: "10px 16px", borderRadius: 24, border: "1.5px solid #eee", fontSize: 14, outline: "none", background: "#f8f9fa", fontFamily: "inherit" },
  sendBtn: { padding: "10px 18px", borderRadius: 24, border: "none", background: "linear-gradient(135deg,#6c5ce7,#a29bfe)", color: "#fff", fontSize: 13, fontWeight: 600 },
  sendDisabled: { opacity: .45 },
  staticPage: { flex: 1, overflowY: "auto", padding: "28px 32px" },
  pageTitle: { fontSize: 22, fontWeight: 700, color: "#2d3436", marginBottom: 22 },
  faqDeptTitle: { fontSize: 14, fontWeight: 700, color: "#6c5ce7", marginBottom: 8 },
  faqItem: { display: "block", width: "100%", textAlign: "left", padding: "10px 14px", marginBottom: 6, borderRadius: 10, border: "1px solid #eee", background: "#fff", fontSize: 13, color: "#2d3436" },
  contactCard: { background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,.06)" },
  contactDept: { fontWeight: 700, fontSize: 15, color: "#2d3436", marginBottom: 8 },
  contactInfo: { fontSize: 13, color: "#636e72", marginBottom: 4 },
  fbBtn: { background: "none", border: "1px solid #eee", borderRadius: 6, fontSize: 13, padding: "2px 6px", color: "#b2bec3" },
  fbUp: { color: "#00b894", borderColor: "#00b894" },
  fbDown: { color: "#e17055", borderColor: "#e17055" },
  fbCommentBox: { display: "flex", gap: 6, marginTop: 4 },
  fbInput: { flex: 1, padding: "5px 10px", borderRadius: 8, border: "1px solid #eee", fontSize: 12, outline: "none", fontFamily: "inherit" },
  fbSubmit: { padding: "5px 12px", borderRadius: 8, border: "none", background: "#6c5ce7", color: "#fff", fontSize: 12, cursor: "pointer" },
  recentBtn: { display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 10px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", marginBottom: 2, textAlign: "left", transition: "background .15s" },
  recentBtnActive: { background: "#f0eeff" },
  recentIcon: { width: 26, height: 26, borderRadius: 7, background: "#f0eeff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 },
  recentText: { flex: 1, minWidth: 0 },
  recentMsg: { fontSize: 11, fontWeight: 500, color: "#2d3436", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  recentTime: { fontSize: 9, color: "#b2bec3", marginTop: 1 },
  recentDot: { width: 6, height: 6, borderRadius: "50%", background: "#6c5ce7", flexShrink: 0 },
  newChatBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "6px 10px", borderRadius: 10, border: "1.5px dashed #d0c8ff", background: "transparent", color: "#6c5ce7", fontSize: 11, fontWeight: 600, cursor: "pointer", marginBottom: 3, marginTop: 2 },
  ctxBtn: { display: "block", width: "100%", padding: "9px 16px", border: "none", background: "transparent", fontSize: 13, color: "#2d3436", cursor: "pointer", textAlign: "left", fontFamily: "inherit" },
};