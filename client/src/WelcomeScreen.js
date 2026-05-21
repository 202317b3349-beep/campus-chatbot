export default function WelcomeScreen({ user, onEnter }) {
  const isAdmin = user?.role === "admin";

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn  { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
        @keyframes ringRot  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse2   { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.5)} 70%{box-shadow:0 0 0 10px rgba(74,222,128,0)} }
        @keyframes shimText { 0%,100%{opacity:.7} 50%{opacity:1} }
        * { box-sizing:border-box; }
        .enter-btn:hover { filter:brightness(1.1); transform:translateY(-2px) !important; box-shadow:0 12px 36px rgba(0,42,107,.45) !important; }
        .enter-btn:active { transform:translateY(0) !important; }
      `}</style>

      {/* Background decoration */}
      <div style={s.bgBlob1}/>
      <div style={s.bgBlob2}/>
      <div style={s.bgGrid}/>

      <div style={s.card}>

        {/* BITS Logo with rotating ring */}
        <div style={s.logoSection}>
          <div style={s.logoRingOuter}/>
          <div style={s.logoRingInner}/>
          <div style={s.logoFrame}>
            <img
              src="/bits-logo.png"
              alt="BITS Pilani"
              style={s.logoImg}
              onError={e => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div style={{...s.logoFallback, display:"none"}}>🎓</div>
          </div>
        </div>

        {/* Institute name */}
        <div style={s.instName}>BITS Pilani</div>
        <div style={s.instSub}>Birla Institute of Technology &amp; Science</div>

        {/* Divider */}
        <div style={s.divider}/>

        {/* Welcome message */}
        <div style={s.welcomeText}>
          {isAdmin ? "Welcome, Admin 🛠️" : `Welcome, ${user?.name?.split(" ")[0] || "Student"} 👋`}
        </div>
        <div style={s.welcomeSub}>
          {isAdmin
            ? "You have admin access. Manage queries, users, and chat logs from the Admin Portal."
            : "Your campus helpdesk is ready. Ask anything about admissions, library, IT support, or academics."}
        </div>

        {/* Role badge */}
        <div style={{...s.roleBadge, ...(isAdmin ? s.roleBadgeAdmin : s.roleBadgeUser)}}>
          {isAdmin ? "🔑 Admin Access" : "🎓 Student"}
        </div>

        {/* Stats row */}
        <div style={s.statsRow}>
          {[["100+","FAQs"], ["4","Departments"], ["24/7","Available"], ["2","Languages"]].map(([v,l]) => (
            <div key={l} style={s.statItem}>
              <span style={s.statVal}>{v}</span>
              <span style={s.statLbl}>{l}</span>
            </div>
          ))}
        </div>

        {/* Enter button */}
        <button className="enter-btn" style={s.enterBtn} onClick={()=>{
          onEnter();
        }}>
          {isAdmin ? "Go to Admin Portal →" : "Start Chatting →"}
        </button>

        <div style={s.footer}>© 2026 BITS Pilani · CampusBot Helpdesk</div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
    background:"linear-gradient(145deg,#001126 0%,#002a6b 45%,#0041a8 80%,#0050c8 100%)",
    fontFamily:"'Inter',sans-serif", padding:24, position:"relative", overflow:"hidden",
  },
  bgBlob1: {
    position:"absolute", width:500, height:500, borderRadius:"50%",
    background:"rgba(255,255,255,.03)", top:-120, right:-100, pointerEvents:"none",
  },
  bgBlob2: {
    position:"absolute", width:400, height:400, borderRadius:"50%",
    background:"rgba(255,255,255,.025)", bottom:-100, left:-80, pointerEvents:"none",
  },
  bgGrid: {
    position:"absolute", inset:0, pointerEvents:"none",
    backgroundImage:"linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)",
    backgroundSize:"60px 60px",
  },

  card: {
    background:"rgba(255,255,255,.97)", borderRadius:28,
    padding:"48px 44px 36px", width:"100%", maxWidth:520,
    boxShadow:"0 32px 80px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.1)",
    display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center",
    position:"relative", zIndex:1, animation:"scaleIn .6s ease",
  },

  /* Logo */
  logoSection: {
    position:"relative", width:140, height:140,
    display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24,
  },
  logoRingOuter: {
    position:"absolute", inset:0, borderRadius:"50%",
    border:"1.5px dashed rgba(0,42,107,.18)",
    animation:"ringRot 22s linear infinite",
  },
  logoRingInner: {
    position:"absolute", inset:14, borderRadius:"50%",
    border:"1px dashed rgba(0,42,107,.10)",
    animation:"ringRot 15s linear infinite reverse",
  },
  logoFrame: {
    width:104, height:104, borderRadius:22,
    background:"#fff", overflow:"hidden",
    boxShadow:"0 8px 32px rgba(0,42,107,.18), 0 0 0 3px rgba(0,42,107,.07)",
    display:"flex", alignItems:"center", justifyContent:"center",
  },
  logoImg:     { width:"100%", height:"100%", objectFit:"contain", padding:8 },
  logoFallback:{ width:"100%", height:"100%", alignItems:"center", justifyContent:"center", fontSize:48 },

  instName: { fontSize:26, fontWeight:700, color:"#001a4d", fontFamily:"'Playfair Display',serif", letterSpacing:.4, marginBottom:4 },
  instSub:  { fontSize:12, color:"#6b7c93", letterSpacing:.3, marginBottom:20 },
  divider:  { width:48, height:2, background:"linear-gradient(90deg,#002a6b,#0057cc)", borderRadius:2, marginBottom:20 },

  welcomeText: { fontSize:22, fontWeight:700, color:"#001a4d", marginBottom:8, animation:"fadeUp .5s ease .1s both" },
  welcomeSub:  { fontSize:13, color:"#6b7c93", lineHeight:1.7, maxWidth:380, marginBottom:20, animation:"fadeUp .5s ease .2s both" },

  roleBadge:      { display:"inline-flex", alignItems:"center", gap:6, borderRadius:24, padding:"6px 18px", fontSize:12, fontWeight:600, marginBottom:24, animation:"fadeUp .5s ease .3s both" },
  roleBadgeUser:  { background:"#f0f7ff", color:"#1d4ed8", border:"1px solid #bfdbfe" },
  roleBadgeAdmin: { background:"#fefce8", color:"#854d0e", border:"1px solid #fde68a" },

  statsRow: {
    display:"flex", gap:0, width:"100%", maxWidth:380,
    background:"#f8fafc", borderRadius:14, overflow:"hidden",
    border:"1px solid #e2e8f0", marginBottom:28, animation:"fadeUp .5s ease .4s both",
  },
  statItem: { flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"14px 8px", borderRight:"1px solid #e2e8f0" },
  statVal:  { fontSize:16, fontWeight:700, color:"#001a4d" },
  statLbl:  { fontSize:10, color:"#9aa5b1", marginTop:2, letterSpacing:.4 },

  enterBtn: {
    width:"100%", maxWidth:380, padding:"15px",
    borderRadius:12, border:"none",
    background:"linear-gradient(135deg,#001a4d 0%,#002a6b 50%,#0041a8 100%)",
    color:"#fff", fontSize:15, fontWeight:700,
    cursor:"pointer", letterSpacing:.4, marginBottom:20,
    transition:"all .25s", boxShadow:"0 6px 24px rgba(0,42,107,.32)",
    animation:"fadeUp .5s ease .5s both",
  },
  footer: { fontSize:11, color:"#b0bcc8" },
};