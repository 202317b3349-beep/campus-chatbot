import { useState, useRef, useEffect } from "react";

const SESSION_ID = Math.random().toString(36).slice(2);
const ADMIN_PASSWORD = "campus2026";
const departments = [
  { name: "Admissions", icon: "🏛️", color: "#ff6b6b" },
  { name: "Library",    icon: "📚", color: "#6c5ce7" },
  { name: "IT Support", icon: "💻", color: "#00b894" },
  { name: "Academics",  icon: "🎓", color: "#0984e3" },
];

const UI = {
  en: {
    role:        "Helpdesk Assistant",
    online:      "Online",
    navLabel:    "NAVIGATION",
    deptLabel:   "DEPARTMENTS",
    about:       "About CampusBot",
    aboutText:   "Your AI assistant for all campus queries. Fast, reliable, 24/7.",
    placeholder: "Type your question...",
    send:        "Send ➔",
    faqTitle:    "Frequently Asked Questions",
    contactTitle:"Contact Us",
    noFaqs:      "Click the department to load questions.",
    fallback:    "I'm not sure about that. Please contact helpdesk@bits-pilani.ac.in",
    listenBtn:   "🎤",
    listening:   "Listening...",
    changeLang:  "Change Language",
    greeting:    "Hi!👋How can I help you today?\nI can assist with admissions, library, IT support, academics, and more.",
    initChips:   ["How do I apply for admission?", "Library Timings", "Reset my password", "Check Attendance"],
    navPages:    ["Chat", "FAQs", "Contact"],
  },
  hi: {
    role:        "Helpdesk Sahayak",
    online:      "Online",
    navLabel:    "NAVIGATION",
    deptLabel:   "VIBHAG",
    about:       "CampusBot ke baare mein",
    aboutText:   "Aapka AI assistant — campus ke saare sawaalon ke liye. 24/7 uplabdh.",
    placeholder: "Apna sawaal likhein ya bolein...",
    send:        "Bhejo ➔",
    faqTitle:    "Aam Pooche Jaane Wale Sawaal",
    contactTitle:"Sampark Karein",
    noFaqs:      "Vibhag click karein sawaal load karne ke liye.",
    fallback:    "Mujhe pakka pata nahi. Kripya helpdesk par sampark karein.",
    listenBtn:   "🎤",
    listening:   "Sun raha hoon...",
    changeLang:  "Bhasha Badlein",
    greeting:    "नमस्ते! 👋 मैं आज आपकी किस प्रकार सहायता कर सकता हूँ?\nमैं प्रवेश, पुस्तकालय, आईटी सहायता, शिक्षण‑सम्बन्धी विषयों और अन्य कई मामलों में मदद कर सकता हूँ।",
    initChips: [
  "प्रवेश प्रक्रिया क्या है?","पुस्तकालय का समय","पासवर्ड रीसेट कैसे करें?","उपस्थिति कैसे देखें?"],
    navPages:    ["Chat", "FAQs", "Sampark"],
  },
};

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Emoji + special char remove ───────────────────────────────────
function cleanForSpeech(text) {
  return text
    // IT → "aai tee" so TTS pronounces correctly
    .replace(/\bIT\b/g, "aai tee")
    .replace(/\bERP\b/g, "ee aar pee")
    .replace(/\bLMS\b/g, "el em es")
    // Remove all emoji
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu,   "")
    .replace(/[\u{FE00}-\u{FE0F}]/gu,   "")
    // Keep Hindi + English + punctuation
    .replace(/[^\u0900-\u097F\w\s.,?!।]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Audio ref — so that we can stop ─────────────────────
let currentAudio = null;

function stopSpeech() {
  // To stop English TTS
  window.responsiveVoice?.cancel();
  window.speechSynthesis?.cancel();

  // Hindi audio — hard stop
  if (currentAudio) {
    try {
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = "";
      currentAudio.load();
    } catch(e) {}
    currentAudio = null;
  }

  // Global flag — To stop playNext
  window._ttsStopFlag = (window._ttsStopFlag || 0) + 1;
}

// ── TTS: Hindi → backend proxy | English → ResponsiveVoice ───────
function speakText(text, lang) {
  const clean = cleanForSpeech(text);
  if (!clean) return;

  stopSpeech();

  if (lang === "hi") {
    // ── Hindi: From the ackend Proxy TTS ────────────────
    // Break the 150 chars in small chunks
    const chunks = [];
    const words  = clean.split(" ");
    let current  = "";

    words.forEach(word => {
      if ((current + " " + word).trim().length > 150) {
        if (current) chunks.push(current.trim());
        current = word;
      } else {
        current = (current + " " + word).trim();
      }
    });
    if (current) chunks.push(current.trim());

    let i = 0;

    // An unique speak token for each call
    const myStopToken = (window._ttsStopFlag || 0);

    const playNext = () => {
      // if stopSpeech has been called stop here
      if ((window._ttsStopFlag || 0) !== myStopToken) {
        currentAudio = null;
        return;
      }
      if (i >= chunks.length) {
        currentAudio = null;
        return;
      }
      const chunk = chunks[i++];
      const url   = `http://localhost:5000/api/tts?text=${encodeURIComponent(chunk)}&lang=hi`;
      const audio = new Audio(url);
      currentAudio  = audio;
      audio.volume  = 1.0;

      audio.onended = playNext;
      audio.onerror = (e) => {
        console.warn("Hindi TTS chunk failed, skipping:", e);
        playNext();
      };

      audio.play().catch(err => {
        console.warn("Audio play blocked:", err);
      });
    };

    playNext();

  } else {
    // ── English: ResponsiveVoice with fallback ───────────────────
    if (window.responsiveVoice && window.responsiveVoice.voiceSupport()) {
      window.responsiveVoice.speak(clean, "UK English Female", { rate: 0.9, pitch: 1 });
    } else {
      // Browser fallback
      window.speechSynthesis?.cancel();
      const utt = new SpeechSynthesisUtterance(clean);
      utt.lang  = "en-US";
      utt.rate  = 0.9;
      utt.pitch = 1;
      // Wait for voices to load
      const trySpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const eng = voices.find(v => v.lang.startsWith("en")) || voices[0];
        if (eng) utt.voice = eng;
        window.speechSynthesis.speak(utt);
      };
      if (window.speechSynthesis.getVoices().length) {
        trySpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = trySpeak;
      }
    }
  }
}

// ── Speech Recognition ────────────────────────────────────────────
function createRecognition(lang) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec           = new SR();
  rec.lang            = lang === "hi" ? "hi-IN" : "en-IN";
  rec.interimResults  = false;
  rec.maxAlternatives = 1;
  return rec;
}

// ── API ───────────────────────────────────────────────────────────
async function getReplyFromDB(input, lang) {
  try {
    const res  = await fetch(
      `http://localhost:5000/api/faqs/search?q=${encodeURIComponent(input)}&lang=${lang}`
    );
    const data = await res.json();
    return {
      text:  data.answer || UI[lang].fallback,
      chips: data.chips  || [],
    };
  } catch {
    return {
      text:  lang === "hi"
        ? "Server se connect nahi ho pa raha. Backend start karein."
        : "Cannot connect to server. Please start the backend.",
      chips: [],
    };
  }
}

async function fetchDeptFaqs(dept, lang) {
  try {
    const res = await fetch(
      `http://localhost:5000/api/faqs/by-department?dept=${encodeURIComponent(dept)}&lang=${lang}`
    );
    return await res.json();
  } catch {
    return [];
  }
}

// ── Language Selector ─────────────────────────────────────────────
function LangSelector({ onSelect }) {
  return (
    <div style={ls.wrap}>
      <div style={ls.avatar}>🤖</div>
      <div style={ls.card}>
        <div style={ls.title}>Welcome to CampusBot!</div>
        <div style={ls.sub}>Please choose your preferred language:</div>
        <div style={ls.btnRow}>
          <button style={ls.btnHi} onClick={() => onSelect("hi")}>
            🇮🇳 Hindi
            <span style={ls.hint}>हिंदी में बात करें</span>
          </button>
          <button style={ls.btnEn} onClick={() => onSelect("en")}>
            🌐 English
            <span style={ls.hint}>Chat in English</span>
          </button>
        </div>
      </div>
    </div>
  );
}
const ls = {
  wrap:   { display:"flex", gap:10, alignItems:"flex-start", animation:"fadeUp 0.3s ease" },
  avatar: { width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#6c5ce7,#a29bfe)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 },
  card:   { background:"#fff", borderRadius:"4px 18px 18px 18px", padding:"16px 18px", boxShadow:"0 2px 10px rgba(108,92,231,0.13)", maxWidth:320 },
  title:  { fontWeight:700, fontSize:15, color:"#2d3436", marginBottom:6 },
  sub:    { fontSize:13, color:"#636e72", marginBottom:14, lineHeight:1.5 },
  btnRow: { display:"flex", gap:10 },
  btnHi:  { flex:1, padding:"10px 12px", borderRadius:12, border:"2px solid #6c5ce7", background:"linear-gradient(135deg,#6c5ce7,#a29bfe)", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 },
  btnEn:  { flex:1, padding:"10px 12px", borderRadius:12, border:"2px solid #6c5ce7", background:"#fff", color:"#6c5ce7", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 },
  hint:   { fontSize:10, fontWeight:400, opacity:0.7 },
};

function AdminPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/feedback/all")
      .then(r => r.json())
      .then(d => { setLogs(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={s.staticPage}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20}}>
        <h2 style={s.pageTitle}>🛠️ Admin — Chat History</h2>
        <a href="http://localhost:5000/api/feedback/csv" download style={s.csvBtn}>
          ⬇️ Download CSV
        </a>
      </div>
      {loading ? <p>Loading...</p> : (
        <div style={{overflowX:"auto"}}>
          <table style={s.table}>
            <thead>
              <tr>
                {["Time","Lang","User Message","Bot Reply","Feedback","Comment"].map(h=>(
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} style={{background: i%2===0?"#f8f9fa":"#fff"}}>
                  <td style={s.td}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={s.td}>{log.lang}</td>
                  <td style={s.td}>{log.userMsg}</td>
                  <td style={s.td}>{log.botReply.slice(0,80)}...</td>
                  <td style={{...s.td, textAlign:"center"}}>{log.feedback==="up"?"👍":log.feedback==="down"?"👎":"—"}</td>
                  <td style={s.td}>{log.comment||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <p style={{color:"#b2bec3"}}>No chat logs yet.</p>}
        </div>
      )}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────
export default function App() {
  const [lang,        setLang]        = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [activePage,  setActivePage]  = useState("Chat");
  const [activeDept,  setActiveDept]  = useState(null);
  const [isTyping,    setIsTyping]    = useState(false);
  const [deptFaqs,    setDeptFaqs]    = useState({});
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled,  setTtsEnabled]  = useState(false);
  const [msgIds,      setMsgIds]      = useState({});
  const [feedbacks,   setFeedbacks]   = useState({});
  const [fbComment,   setFbComment]   = useState({});
  const [fbOpen,      setFbOpen]      = useState(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPwInput,  setAdminPwInput]  = useState("");
  const [adminPwError,  setAdminPwError]  = useState(false);
  const [sessions,      setSessions]      = useState(() => {
    try { return JSON.parse(localStorage.getItem("campusbot_sessions") || "[]"); }
    catch { return []; }
  });
  const [activeSession,  setActiveSession]  = useState(SESSION_ID);
  const [contextMenu,    setContextMenu]    = useState(null);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const bottomRef = useRef(null);
  const recRef    = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleLangSelect = (chosen) => {
    setLang(chosen);
    setDeptFaqs({});
    setMessages([{
      from:  "bot",
      text:  UI[chosen].greeting,
      chips: UI[chosen].initChips,
      time:  formatTime(),
    }]);
  };

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || !lang) return;
    stopSpeech();
    setSpeakingIdx(null);
    setInput("");
    setActivePage("Chat");
    setMessages(prev => [...prev, { from:"user", text:userText, time:formatTime() }]);
    setIsTyping(true);

    setTimeout(async () => {
      const reply = await getReplyFromDB(userText, lang);
      setIsTyping(false);

      // Save to DB
      let logId = null;
      try {
        const logRes = await fetch("http://localhost:5000/api/feedback/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: SESSION_ID,
            userMsg: userText,
            botReply: reply.text,
            lang,
            department: "General",
          }),
        });
        const logData = await logRes.json();
        logId = logData.id;
      } catch (e) { console.warn("Log save failed", e); }

      setMessages(prev => {
        const updated = [...prev, { from:"bot", text:reply.text, chips:reply.chips, time:formatTime() }];
        
        // Save the session in localStorage
        const firstUserMsg = updated.find(m => m.from === "user");
        if (firstUserMsg) {
          setSessions(prev => {
            const exists = prev.find(s => s.id === activeSession);
            let newSessions;
            if (exists) {
              newSessions = prev.map(s => s.id === activeSession
                ? { ...s, messages: updated, lastMsg: firstUserMsg.text, time: formatTime() }
                : s
              );
            } else {
              newSessions = [
                { id: activeSession, messages: updated, lastMsg: firstUserMsg.text, time: formatTime(), lang },
                ...prev
              ].slice(0, 10);
            }
            localStorage.setItem("campusbot_sessions", JSON.stringify(newSessions));
            return newSessions;
          });
        }
        if (logId) {
          setMsgIds(p => ({ ...p, [updated.length - 1]: logId }));
        }
        if (ttsEnabled) {
          setTimeout(() => speakText(reply.text, lang), 200);
          setSpeakingIdx(updated.length - 1);
        }
        return updated;
      });
    }, 900);
  };

  const handleSpeakMsg = (text, idx) => {
    if (speakingIdx === idx) {
      stopSpeech();
      setSpeakingIdx(null);
    } else {
      stopSpeech();
      speakText(text, lang);
      setSpeakingIdx(idx);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recRef.current?.stop();
      setIsListening(false);
      return;
    }
    const rec = createRecognition(lang);
    if (!rec) { alert("Please use Chrome for speech recognition."); return; }
    recRef.current = rec;
    rec.start();
    setIsListening(true);
    rec.onresult = (e) => { setInput(e.results[0][0].transcript); setIsListening(false); };
    rec.onerror  = () => setIsListening(false);
    rec.onend    = () => setIsListening(false);
  };

  const handleDeptClick = async (dept) => {
    setActiveDept(dept);
    setActivePage("FAQs");
    const key = `${dept}_${lang}`;
    if (!deptFaqs[key]) {
      const questions = await fetchDeptFaqs(dept, lang || "en");
      setDeptFaqs(prev => ({ ...prev, [key]: questions }));
    }
  };

  const L       = lang ? UI[lang] : UI.en;
  const navKeys = ["Chat", "FAQs", "Contact"];

  return (
    <div style={s.page} onClick={() => contextMenu && setContextMenu(null)}>
      <style>{`
        @keyframes blink      { 0%,100%{opacity:.2} 50%{opacity:1} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes ripple     { 0%{box-shadow:0 0 0 0 rgba(239,83,80,0.5)} 100%{box-shadow:0 0 0 12px rgba(239,83,80,0)} }
        @keyframes speakPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        ::-webkit-scrollbar       { width:4px }
        ::-webkit-scrollbar-thumb { background:#ddd; border-radius:4px }
        button { cursor:pointer; }
        button:hover { opacity:0.88; }
        * { box-sizing:border-box; }
      `}</style>

      {/* SIDEBAR */}
      <div style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.botProfile}>
            <div style={s.botAvatar}>🎓</div>
            <div>
              <div style={s.botName}>CampusBot</div>
              <div style={s.botRole}>{L.role}</div>
              <div style={s.onlineBadge}><span style={s.greenDot}/> {L.online}</div>
            </div>
          </div>

          <div style={s.ttsRow}>
            <span style={s.ttsLabel}>🔊 Auto-speak</span>
            <div style={{...s.toggle, ...(ttsEnabled ? s.toggleOn : {})}}
              onClick={() => setTtsEnabled(p => !p)}>
              <div style={{...s.toggleThumb, ...(ttsEnabled ? s.toggleThumbOn : {})}}/>
            </div>
          </div>

          {lang && (
            <button style={s.langBadge}
              onClick={() => { stopSpeech(); setLang(null); setMessages([]); }}>
              {lang === "hi" ? "🇮🇳 Hindi" : "🌐 English"} · {L.changeLang}
            </button>
          )}
            
         <button style={s.adminBtn} onClick={() => {
            if (adminUnlocked) { setActivePage("Admin"); }
            else { setActivePage("AdminLogin"); }
          }}>
            🛠️ Admin Panel
          </button>  

          <div style={s.navLabel}>{L.navLabel}</div>
          {L.navPages.map((page, i) => (
            <button key={navKeys[i]} onClick={() => setActivePage(navKeys[i])}
              style={{...s.navBtn, ...(activePage === navKeys[i] ? s.navBtnActive : {})}}>
              <span>{navKeys[i] === "Chat" ? "💬" : navKeys[i] === "FAQs" ? "❓" : "📞"}</span>
              {page}
            </button>
          ))}

{sessions.length > 0 && (<>
            <div style={s.navLabel}>RECENT CHATS</div>

            {/* Right-click context menu */}
            {contextMenu && (
              <div style={{
                position:"fixed",
                top: contextMenu.y,
                left: contextMenu.x,
                background:"#fff",
                borderRadius:10,
                boxShadow:"0 4px 20px rgba(0,0,0,0.15)",
                border:"1px solid #eee",
                zIndex:9999,
                minWidth:160,
                overflow:"hidden",
              }}
              onMouseLeave={() => setContextMenu(null)}>
                <div style={{padding:"6px 0"}}>
                  <div style={{padding:"8px 16px", fontSize:11, color:"#b2bec3", fontWeight:700, letterSpacing:0.5}}>
                    OPTIONS
                  </div>
                  <button style={s.ctxBtn} onClick={() => {
                    // Is session ko load karo
                    const sess = sessions.find(s => s.id === contextMenu.sessId);
                    if (sess) {
                      setActiveSession(sess.id);
                      setMessages(sess.messages);
                      if (sess.lang) setLang(sess.lang);
                      setActivePage("Chat");
                    }
                    setContextMenu(null);
                  }}>
                    💬 Open Chat
                  </button>
                  <div style={{height:1, background:"#f0f0f0", margin:"4px 0"}}/>
                  <button style={{...s.ctxBtn, color:"#e17055"}} onClick={() => {
                    // Delete this session only
                    setSessions(prev => {
                      const updated = prev.filter(s => s.id !== contextMenu.sessId);
                      localStorage.setItem("campusbot_sessions", JSON.stringify(updated));
                      // If active session has been deleted start the new chat
                      if (activeSession === contextMenu.sessId) {
                        const newId = Math.random().toString(36).slice(2);
                        setActiveSession(newId);
                        setMessages([{
                          from:"bot",
                          text: lang ? UI[lang].greeting : UI.en.greeting,
                          chips: lang ? UI[lang].initChips : UI.en.initChips,
                          time: formatTime(),
                        }]);
                      }
                      return updated;
                    });
                    setContextMenu(null);
                  }}>
                    🗑️ Delete This Chat
                  </button>
                  <button style={{...s.ctxBtn, color:"#e17055"}} onClick={() => {
                    // Clear all the sessions
                    setSessions([]);
                    localStorage.removeItem("campusbot_sessions");
                    const newId = Math.random().toString(36).slice(2);
                    setActiveSession(newId);
                    setMessages([{
                      from:"bot",
                      text: lang ? UI[lang].greeting : UI.en.greeting,
                      chips: lang ? UI[lang].initChips : UI.en.initChips,
                      time: formatTime(),
                    }]);
                    setContextMenu(null);
                  }}>
                    🧹 Clear All Chats
                  </button>
                </div>
              </div>
            )}

            {sessions.slice(0, 10).map((sess, i) => (
              <button key={sess.id}
                onClick={() => {
                  setActiveSession(sess.id);
                  setMessages(sess.messages);
                  if (sess.lang) setLang(sess.lang);
                  setActivePage("Chat");
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, sessId: sess.id });
                }}
                style={{
                  ...s.recentBtn,
                  ...(activeSession === sess.id ? s.recentBtnActive : {})
                }}>
                <div style={s.recentIcon}>
                  {sess.lang === "hi" ? "🇮🇳" : "💬"}
                </div>
                <div style={s.recentText}>
                  <div style={s.recentMsg}>
                    {sess.lastMsg?.slice(0, 22)}{sess.lastMsg?.length > 22 ? "…" : ""}
                  </div>
                  <div style={s.recentTime}>{sess.time}</div>
                </div>
                {activeSession === sess.id && (
                  <div style={s.recentDot}/>
                )}
              </button>
            ))}

            <button style={s.newChatBtn} onClick={() => {
              const newId = Math.random().toString(36).slice(2);
              setActiveSession(newId);
              setMessages([{
                from: "bot",
                text: lang ? UI[lang].greeting : UI.en.greeting,
                chips: lang ? UI[lang].initChips : UI.en.initChips,
                time: formatTime(),
              }]);
              setActivePage("Chat");
            }}>
              ✚ New Chat
            </button>
          </>)}

          <div style={s.navLabel}>{L.deptLabel}</div>
          {departments.map(d => (
            <button key={d.name} onClick={() => handleDeptClick(d.name)}
              style={{...s.deptBtn, ...(activeDept === d.name && activePage === "FAQs" ? s.deptBtnActive : {})}}>
              <span style={{...s.deptIcon, background:d.color+"22", color:d.color}}>{d.icon}</span>
              {d.name}
            </button>
          ))}
        </div>

        <div style={s.sidebarBottom}>
          <div style={s.aboutBox}>
            <div style={s.aboutTitle}>{L.about}</div>
            <div style={s.aboutText}>{L.aboutText}</div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={s.main}>
        {activePage === "Chat" && (<>
          <div style={s.hero}>
            <div style={s.heroOverlay}>
              <div style={s.heroTitle}>Campus Helpdesk Chatbot</div>
              <div style={s.heroSub}>Your one-stop solution for campus information and support</div>
            </div>
            <div style={s.heroBadge}>Online &amp; Ready to Help</div>
          </div>

          <div style={s.chatArea}>
            {!lang && <LangSelector onSelect={handleLangSelect} />}

            {messages.map((msg, i) => (
              <div key={i} style={{animation:"fadeUp 0.3s ease", ...(msg.from==="bot" ? s.botRow : s.userRow)}}>
                {msg.from === "bot" && <div style={s.avatar}>🤖</div>}
                <div style={msg.from==="bot" ? s.botMsgWrap : s.userMsgWrap}>
                  <div style={msg.from==="bot" ? s.botBubble : s.userBubble}>
                    {msg.text.split("\n").map((line, j) => (
                      <span key={j}>{line}{j < msg.text.split("\n").length-1 && <br/>}</span>
                    ))}
                  </div>

                  {msg.from === "bot" && (
                    <div style={{display:"flex", flexDirection:"column", gap:4}}>
                      <div style={s.metaRow}>
                        <button
                          style={{...s.speakBtn, ...(speakingIdx === i ? s.speakBtnActive : {})}}
                          onClick={() => handleSpeakMsg(msg.text, i)}>
                          {speakingIdx === i ? "⏹" : "🔊"}
                        </button>
                        <span style={s.timeLeft}>{msg.time}</span>
                        {msgIds[i] && (
                          <div style={{display:"flex", gap:4, marginLeft:6}}>
                            <button style={{...s.fbBtn, ...(feedbacks[i]==="up" ? s.fbUp : {})}}
                              onClick={async () => {
                                setFeedbacks(p=>({...p,[i]:"up"}));
                                setFbOpen(i);
                                await fetch(`http://localhost:5000/api/feedback/${msgIds[i]}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({feedback:"up"})});
                              }}>👍</button>
                            <button style={{...s.fbBtn, ...(feedbacks[i]==="down" ? s.fbDown : {})}}
                              onClick={async () => {
                                setFeedbacks(p=>({...p,[i]:"down"}));
                                setFbOpen(i);
                                await fetch(`http://localhost:5000/api/feedback/${msgIds[i]}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({feedback:"down"})});
                              }}>👎</button>
                          </div>
                        )}
                      </div>
                      {fbOpen === i && msgIds[i] && (
                        <div style={s.fbCommentBox}>
                          <input style={s.fbInput} placeholder="Optional comment..."
                            value={fbComment[i]||""}
                            onChange={e=>setFbComment(p=>({...p,[i]:e.target.value}))}/>
                          <button style={s.fbSubmit} onClick={async()=>{
                            await fetch(`http://localhost:5000/api/feedback/${msgIds[i]}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({feedback:feedbacks[i],comment:fbComment[i]||""})});
                            setFbOpen(null);
                          }}>Save</button>
                        </div>
                      )}
                    </div>
                  )}
                  {msg.from === "user" && (
                    <div style={s.timeRight}>{msg.time} ✓✓</div>
                  )}

                  {msg.chips?.length > 0 && (
                    <div style={s.chipsRow}>
                      {msg.chips.map((chip, j) => (
                        <button key={j} style={s.chip} onClick={() => sendMessage(chip)}>{chip}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={s.botRow}>
                <div style={s.avatar}>🤖</div>
                <div style={s.botBubble}>
                  <span style={s.dot1}>●</span>
                  <span style={s.dot2}>●</span>
                  <span style={s.dot3}>●</span>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div style={s.inputBar}>
            <button style={{...s.micBtn, ...(isListening ? s.micActive : {})}}
              onClick={toggleListening} disabled={!lang}>
              {isListening ? "⏹" : "🎤"}
            </button>
            <input
              style={s.input}
              placeholder={isListening ? L.listening : L.placeholder}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              disabled={!lang}
            />
            <button style={{...s.sendBtn, ...(!lang ? s.sendDisabled : {})}}
              onClick={() => sendMessage()}>
              {L.send}
            </button>
          </div>
        </>)}

        {activePage === "FAQs" && (
          <div style={s.staticPage}>
            <h2 style={s.pageTitle}>{L.faqTitle}</h2>
            {departments.map(d => {
              const key = `${d.name}_${lang}`;
              return (
                <div key={d.name} style={{marginBottom:28}}>
                  <div style={s.faqDeptTitle}>{d.icon} {d.name}</div>
                  {(deptFaqs[key] || []).map((q, i) => (
                    <button key={i} style={s.faqItem} onClick={() => sendMessage(q)}>❓ {q}</button>
                  ))}
                  {!deptFaqs[key] && (
                    <div style={{fontSize:13, color:"#b2bec3", padding:"6px 2px"}}>{L.noFaqs}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {activePage === "AdminLogin" && (
          <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#f8f9fa"}}>
            <div style={{background:"#fff", borderRadius:16, padding:"32px 28px", boxShadow:"0 4px 20px rgba(0,0,0,0.1)", width:300}}>
              <div style={{fontSize:18, fontWeight:700, color:"#2d3436", marginBottom:6}}>🔐 Admin Login</div>
              <div style={{fontSize:13, color:"#636e72", marginBottom:20}}>Enter password to access admin panel</div>
              <input
                type="password"
                style={{width:"100%", padding:"10px 14px", borderRadius:10, border: adminPwError ? "1.5px solid #e17055" : "1.5px solid #eee", fontSize:14, outline:"none", fontFamily:"inherit", marginBottom:10, boxSizing:"border-box"}}
                placeholder="Enter password..."
                value={adminPwInput}
                onChange={e => { setAdminPwInput(e.target.value); setAdminPwError(false); }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    if (adminPwInput === ADMIN_PASSWORD) { setAdminUnlocked(true); setActivePage("Admin"); setAdminPwInput(""); }
                    else { setAdminPwError(true); }
                  }
                }}
              />
              {adminPwError && <div style={{fontSize:12, color:"#e17055", marginBottom:8}}>❌ Wrong password. Try again.</div>}
              <button style={{width:"100%", padding:"10px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#6c5ce7,#a29bfe)", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer"}}
                onClick={() => {
                  if (adminPwInput === ADMIN_PASSWORD) { setAdminUnlocked(true); setActivePage("Admin"); setAdminPwInput(""); }
                  else { setAdminPwError(true); }
                }}>
                Login
              </button>
              <button style={{width:"100%", marginTop:8, padding:"8px", borderRadius:10, border:"1px solid #eee", background:"transparent", color:"#636e72", fontSize:13, cursor:"pointer"}}
                onClick={() => setActivePage("Chat")}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {activePage === "Admin" && adminUnlocked && (
          <AdminPanel />
        )}
  
        {activePage === "Contact" && (
          <div style={s.staticPage}>
            <h2 style={s.pageTitle}>{L.contactTitle}</h2>
            {[
              {dept:"🏛️ Admissions", email:"admissions@bits-pilani.ac.in", phone:"+91-1596-242192"},
              {dept:"📚 Library",    email:"library@bits-pilani.ac.in",    phone:"+91-1596-242210"},
              {dept:"💻 IT Support", email:"ithelp@bits-pilani.ac.in",     phone:"+91-1596-242220"},
              {dept:"🎓 Academics",  email:"academics@bits-pilani.ac.in",  phone:"+91-1596-242200"},
            ].map((c, i) => (
              <div key={i} style={s.contactCard}>
                <div style={s.contactDept}>{c.dept}</div>
                <div style={s.contactInfo}>📧 {c.email}</div>
                <div style={s.contactInfo}>📞 {c.phone}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page:          { display:"flex", height:"100vh", fontFamily:"'Segoe UI',sans-serif", background:"#f0f2f5", overflow:"hidden" },
  sidebar:       { width:240, background:"#fff", borderRight:"1px solid #eee", display:"flex", flexDirection:"column", justifyContent:"space-between", flexShrink:0 },
  sidebarTop:    { padding:"18px 14px", overflowY:"auto" },
  botProfile:    { display:"flex", gap:12, alignItems:"center", marginBottom:12 },
  botAvatar:     { width:46, height:46, background:"linear-gradient(135deg,#6c5ce7,#a29bfe)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 },
  botName:       { fontWeight:700, fontSize:14, color:"#2d3436" },
  botRole:       { fontSize:11, color:"#636e72", marginBottom:2 },
  onlineBadge:   { display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#00b894", fontWeight:600 },
  greenDot:      { width:7, height:7, borderRadius:"50%", background:"#00b894", display:"inline-block", animation:"pulse 2s infinite" },
  ttsRow:        { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 4px", marginBottom:6 },
  ttsLabel:      { fontSize:12, color:"#636e72" },
  toggle:        { width:36, height:20, borderRadius:10, background:"#dfe6e9", position:"relative", cursor:"pointer", transition:"background 0.2s" },
  toggleOn:      { background:"#6c5ce7" },
  toggleThumb:   { position:"absolute", top:2, left:2, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" },
  toggleThumbOn: { left:18 },
  langBadge:     { fontSize:11, color:"#6c5ce7", fontWeight:600, background:"#f0eeff", borderRadius:8, padding:"5px 10px", marginBottom:10, border:"none", display:"block", width:"100%", textAlign:"left" },
  navLabel:      { fontSize:10, fontWeight:700, color:"#b2bec3", letterSpacing:1, marginTop:12, marginBottom:5 },
  navBtn:        { display:"flex", alignItems:"center", gap:10, width:"100%", padding:"9px 10px", borderRadius:10, border:"none", background:"transparent", fontSize:13, color:"#636e72", fontWeight:500, marginBottom:2, textAlign:"left" },
  navBtnActive:  { background:"#f0eeff", color:"#6c5ce7", fontWeight:700 },
  deptBtn:       { display:"flex", alignItems:"center", gap:10, width:"100%", padding:"7px 10px", borderRadius:10, border:"none", background:"transparent", fontSize:13, color:"#636e72", marginBottom:2, textAlign:"left" },
  deptBtnActive: { background:"#f0eeff", color:"#6c5ce7" },
  deptIcon:      { width:28, height:28, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 },
  sidebarBottom: { padding:"14px" },
  aboutBox:      { background:"#f8f9fa", borderRadius:12, padding:"12px 14px" },
  aboutTitle:    { fontWeight:600, fontSize:12, color:"#2d3436", marginBottom:4 },
  aboutText:     { fontSize:11, color:"#636e72", lineHeight:1.5 },
  main:          { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
  hero:          { position:"relative", height:150, background:"linear-gradient(135deg,#6c5ce7,#a29bfe)", flexShrink:0, backgroundImage:"url('/campus.jpg')", backgroundSize:"cover", backgroundPosition:"center", backgroundBlendMode:"overlay" },
  heroOverlay:   { position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"rgba(70,50,170,0.62)" },
  heroTitle:     { color:"#fff", fontSize:19, fontWeight:700 },
  heroSub:       { color:"rgba(255,255,255,0.85)", fontSize:11, marginTop:4 },
  heroBadge:     { position:"absolute", top:10, right:14, background:"#fff", borderRadius:20, padding:"4px 11px", fontSize:11, fontWeight:600, color:"#00b894", boxShadow:"0 2px 8px rgba(0,0,0,0.1)" },
  chatArea:      { flex:1, overflowY:"auto", padding:"18px 24px", display:"flex", flexDirection:"column", gap:14, background:"linear-gradient(rgba(248,249,250,0.9),rgba(248,249,250,0.9)),url('/bits-logo.jpeg') center/250px no-repeat" },
  botRow:        { display:"flex", gap:10, alignItems:"flex-start" },
  userRow:       { display:"flex", justifyContent:"flex-end" },
  avatar:        { width:34, height:34, background:"linear-gradient(135deg,#6c5ce7,#a29bfe)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 },
  botMsgWrap:    { maxWidth:"62%", display:"flex", flexDirection:"column", gap:2 },
  userMsgWrap:   { maxWidth:"62%", display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2 },
  botBubble:     { background:"#fff", color:"#2d3436", padding:"12px 16px", borderRadius:"4px 16px 16px 16px", fontSize:14, lineHeight:1.65, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" },
  userBubble:    { background:"linear-gradient(135deg,#6c5ce7,#a29bfe)", color:"#fff", padding:"12px 16px", borderRadius:"16px 4px 16px 16px", fontSize:14, lineHeight:1.65 },
  metaRow:       { display:"flex", alignItems:"center", gap:6, marginTop:2 },
  speakBtn:      { background:"none", border:"1px solid #eee", borderRadius:6, fontSize:12, color:"#b2bec3", padding:"2px 6px", lineHeight:1, transition:"all 0.2s" },
  speakBtnActive:{ color:"#6c5ce7", borderColor:"#6c5ce7", animation:"speakPulse 1s infinite" },
  timeLeft:      { fontSize:11, color:"#b2bec3" },
  timeRight:     { fontSize:11, color:"#b2bec3", paddingRight:2, textAlign:"right", marginTop:2 },
  chipsRow:      { display:"flex", flexWrap:"wrap", gap:6, marginTop:5 },
  chip:          { padding:"6px 14px", borderRadius:20, border:"1.5px solid #6c5ce7", background:"#fff", color:"#6c5ce7", fontSize:12, fontWeight:500 },
  dot1:          { fontSize:10, color:"#b2bec3", animation:"blink 1s infinite", marginRight:2, animationDelay:"0s" },
  dot2:          { fontSize:10, color:"#b2bec3", animation:"blink 1s infinite", marginRight:2, animationDelay:"0.2s" },
  dot3:          { fontSize:10, color:"#b2bec3", animation:"blink 1s infinite", animationDelay:"0.4s" },
  inputBar:      { display:"flex", alignItems:"center", gap:8, padding:"11px 18px", background:"#fff", borderTop:"1px solid #eee", flexShrink:0 },
  micBtn:        { width:40, height:40, borderRadius:"50%", border:"2px solid #eee", background:"#f8f9fa", fontSize:17, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s" },
  micActive:     { background:"#fff0f0", borderColor:"#ef5350", animation:"ripple 1s infinite" },
  input:         { flex:1, padding:"10px 16px", borderRadius:24, border:"1.5px solid #eee", fontSize:14, outline:"none", background:"#f8f9fa", fontFamily:"inherit" },
  sendBtn:       { padding:"10px 18px", borderRadius:24, border:"none", background:"linear-gradient(135deg,#6c5ce7,#a29bfe)", color:"#fff", fontSize:13, fontWeight:600 },
  sendDisabled:  { opacity:0.45 },
  staticPage:    { flex:1, overflowY:"auto", padding:"28px 32px" },
  pageTitle:     { fontSize:22, fontWeight:700, color:"#2d3436", marginBottom:22 },
  faqDeptTitle:  { fontSize:14, fontWeight:700, color:"#6c5ce7", marginBottom:8 },
  faqItem:       { display:"block", width:"100%", textAlign:"left", padding:"10px 14px", marginBottom:6, borderRadius:10, border:"1px solid #eee", background:"#fff", fontSize:13, color:"#2d3436" },
  contactCard:   { background:"#fff", borderRadius:14, padding:"16px 20px", marginBottom:14, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" },
  contactDept:   { fontWeight:700, fontSize:15, color:"#2d3436", marginBottom:8 },
  contactInfo:   { fontSize:13, color:"#636e72", marginBottom:4 },
  adminBtn:    { display:"block", width:"100%", padding:"7px 10px", borderRadius:10, border:"1.5px solid #6c5ce7", background:"#f0eeff", color:"#6c5ce7", fontSize:12, fontWeight:700, marginBottom:10, textAlign:"left" },
  fbBtn:       { background:"none", border:"1px solid #eee", borderRadius:6, fontSize:13, padding:"2px 6px", color:"#b2bec3" },
  fbUp:        { color:"#00b894", borderColor:"#00b894" },
  fbDown:      { color:"#e17055", borderColor:"#e17055" },
  fbCommentBox:{ display:"flex", gap:6, marginTop:4 },
  fbInput:     { flex:1, padding:"5px 10px", borderRadius:8, border:"1px solid #eee", fontSize:12, outline:"none", fontFamily:"inherit" },
  fbSubmit:    { padding:"5px 12px", borderRadius:8, border:"none", background:"#6c5ce7", color:"#fff", fontSize:12, cursor:"pointer" },
  csvBtn:      { padding:"8px 16px", borderRadius:10, background:"linear-gradient(135deg,#00b894,#00cec9)", color:"#fff", fontSize:13, fontWeight:600, textDecoration:"none" },
  table:       { width:"100%", borderCollapse:"collapse", fontSize:12 },
  th:          { background:"#6c5ce7", color:"#fff", padding:"8px 12px", textAlign:"left", whiteSpace:"nowrap" },
  td:          { padding:"7px 12px", borderBottom:"1px solid #eee", color:"#2d3436", verticalAlign:"top", maxWidth:200, wordBreak:"break-word" }, 
  recentBtn:       { display:"flex", alignItems:"center", gap:8, width:"100%", padding:"7px 10px", borderRadius:10, border:"none", background:"transparent", cursor:"pointer", marginBottom:2, textAlign:"left", transition:"background 0.15s" },
  recentBtnActive: { background:"#f0eeff" },
  recentIcon:      { width:28, height:28, borderRadius:8, background:"#f0eeff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 },
  recentText:      { flex:1, minWidth:0 },
  recentMsg:       { fontSize:12, fontWeight:500, color:"#2d3436", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  recentTime:      { fontSize:10, color:"#b2bec3", marginTop:1 },
  recentDot:       { width:6, height:6, borderRadius:"50%", background:"#6c5ce7", flexShrink:0 },
  newChatBtn:      { display:"flex", alignItems:"center", justifyContent:"center", gap:6, width:"100%", padding:"7px 10px", borderRadius:10, border:"1.5px dashed #d0c8ff", background:"transparent", color:"#6c5ce7", fontSize:12, fontWeight:600, cursor:"pointer", marginBottom:4, marginTop:2 },
  ctxBtn: { display:"block", width:"100%", padding:"9px 16px", border:"none", background:"transparent", fontSize:13, color:"#2d3436", cursor:"pointer", textAlign:"left", fontFamily:"inherit" },
};
