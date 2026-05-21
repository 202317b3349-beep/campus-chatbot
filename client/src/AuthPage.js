import { useState } from "react";

export default function AuthPage({ onAuth }) {
  const [mode,    setMode]    = useState("login");
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pass,    setPass]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => { setError(""); setName(""); setEmail(""); setPass(""); setConfirm(""); };

  const handleSubmit = async () => {
    setError("");
    if (!email || !pass) return setError("Email and password are required.");
    if (mode === "signup") {
      if (!name)            return setError("Please enter your full name.");
      if (pass.length < 6)  return setError("Password must be at least 6 characters.");
      if (pass !== confirm) return setError("Passwords do not match.");
    }
    setLoading(true);
    try {
      const res  = await fetch(`http://localhost:5000/api/auth/${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setLoading(false); return; }
      localStorage.setItem("campusbot_token", data.token);
      localStorage.setItem("campusbot_user",  JSON.stringify(data.user));
      onAuth(data.user);
    } catch { setError("Cannot connect to server. Please ensure the backend is running."); }
    setLoading(false);
  };

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gentlePulse { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.5)} 70%{box-shadow:0 0 0 10px rgba(74,222,128,0)} }
        @keyframes rotateRing  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .bits-input { width:100%; padding:11px 14px; border-radius:8px; border:1.5px solid #d0d9e4; font-size:14px; font-family:'Inter',sans-serif; color:#1c2b3a; background:#f8fafc; transition:border-color .2s,box-shadow .2s,background .2s; outline:none; }
        .bits-input:focus { border-color:#003580; box-shadow:0 0 0 3px rgba(0,53,128,.10); background:#fff; }
        .bits-input::placeholder { color:#a0aec0; }
        .bits-submit { width:100%; padding:13px; border-radius:9px; border:none; background:linear-gradient(135deg,#002a6b 0%,#003f9e 60%,#0057cc 100%); color:#fff; font-size:14px; font-weight:600; font-family:'Inter',sans-serif; letter-spacing:.4px; cursor:pointer; transition:filter .2s,transform .15s,box-shadow .2s; box-shadow:0 4px 18px rgba(0,42,107,.32); }
        .bits-submit:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-1px); }
        .bits-submit:disabled { opacity:.55; cursor:not-allowed; }
        .bits-tab { flex:1; padding:9px; border-radius:7px; border:none; font-size:13px; font-weight:600; font-family:'Inter',sans-serif; cursor:pointer; transition:all .2s; }
        .bits-tab-active   { background:#fff; color:#002a6b; box-shadow:0 1px 6px rgba(0,42,107,.14); }
        .bits-tab-inactive { background:transparent; color:#7a8fa6; }
        .dept-chip { display:flex; align-items:center; gap:8px; padding:9px 14px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.13); border-radius:8px; color:rgba(255,255,255,.85); font-size:12.5px; font-family:'Inter',sans-serif; }
        .switch-link { background:none; border:none; color:#003580; font-weight:600; font-size:12px; cursor:pointer; font-family:'Inter',sans-serif; text-decoration:underline; padding:0; margin-left:4px; }
      `}</style>

      {/* LEFT PANEL */}
      <div style={s.left}>
        <div style={s.bgCircle1}/><div style={s.bgCircle2}/>
        <div style={s.leftInner}>
          <div style={s.logoWrap}>
            <div style={s.logoRing}/>
            <div style={s.logoFrame}>
              <img src="/bits-logo.png" alt="BITS Pilani" style={s.logoImg}
                onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}/>
              <div style={{...s.logoFallback,display:"none"}}>🎓</div>
            </div>
          </div>
          <div style={s.instName}>BITS Pilani</div>
          <div style={s.instFull}>Birla Institute of Technology &amp; Science</div>
          <div style={s.instEst}>Est. 1964 · Pilani, Rajasthan</div>
          <div style={s.divider}/>
          <div style={s.botBadge}><span style={s.liveIndicator}/>CampusBot — Campus Helpdesk System</div>
          <div style={s.deptGrid}>
            {[{icon:"🏛️",label:"Admissions"},{icon:"📚",label:"Library"},{icon:"💻",label:"IT Support"},{icon:"🎓",label:"Academics"}].map(d=>(
              <div key={d.label} className="dept-chip"><span style={{fontSize:16}}>{d.icon}</span>{d.label}</div>
            ))}
          </div>
          <div style={s.statsStrip}>
            {[["24/7","Availability"],["100+","FAQs"],["4","Departments"]].map(([v,l])=>(
              <div key={l} style={s.statCell}><span style={s.statNum}>{v}</span><span style={s.statLbl}>{l}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={s.right}>
        <div style={s.card}>
          <div style={s.cardTop}>
            <div style={s.cardLogoWrap}>
              <img src="/bits-logo.png" alt="BITS Pilani" style={s.cardLogoImg}
                onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}/>
              <div style={{...s.cardLogoFallback,display:"none"}}>🎓</div>
            </div>
            <div>
              {/* FIXED: "Welcome" instead of "Welcome Back" */}
              <div style={s.cardTitle}>{mode==="login" ? "BITS CampusBot" : "Create Account"}</div>
              <div style={s.cardSub}>{mode==="login" ? "Sign in to access CampusBot" : "Register to access CampusBot"}</div>
            </div>
          </div>

          <div style={s.tabsBar}>
            {["login","signup"].map(m=>(
              <button key={m} className={`bits-tab ${mode===m?"bits-tab-active":"bits-tab-inactive"}`}
                onClick={()=>{reset();setMode(m);}}>
                {m==="login"?"Sign In":"Sign Up"}
              </button>
            ))}
          </div>

          {mode==="signup"&&<div style={s.field}><label style={s.label}>Full Name</label><input className="bits-input" placeholder="Enter your full name" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/></div>}
          <div style={s.field}><label style={s.label}>Email Address</label><input className="bits-input" type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/></div>
          <div style={s.field}><label style={s.label}>Password</label><input className="bits-input" type="password" placeholder={mode==="signup"?"Minimum 6 characters":"Enter your password"} value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/></div>
          {mode==="signup"&&<div style={s.field}><label style={s.label}>Confirm Password</label><input className="bits-input" type="password" placeholder="Re-enter your password" value={confirm} onChange={e=>setConfirm(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/></div>}

          {error&&<div style={s.errorBox}><span>⚠️</span> {error}</div>}

          <div style={{marginTop:6}}>
            <button className="bits-submit" onClick={handleSubmit} disabled={loading}>
              {loading?"Please wait…":mode==="login"?"Sign In  →":"Create Account  →"}
            </button>
          </div>

          <div style={s.switchRow}>
            {mode==="login"?"Don't have an account?":"Already have an account?"}
            <button className="switch-link" onClick={()=>{reset();setMode(mode==="login"?"signup":"login");}}>
              {mode==="login"?"Sign up":"Sign in"}
            </button>
          </div>

          {mode==="login"&&<div style={s.adminNote}>🔑 Admin users — use your registered admin credentials to access the Admin Portal.</div>}
        </div>
        <div style={s.footer}>© 2026 BITS Pilani &nbsp;·&nbsp; CampusBot Campus Helpdesk</div>
      </div>
    </div>
  );
}

const s = {
  root:{display:"flex",height:"100vh",fontFamily:"'Inter',sans-serif",overflow:"hidden"},
  left:{width:"44%",flexShrink:0,background:"linear-gradient(160deg,#001126 0%,#002a6b 45%,#003f9e 80%,#0050c8 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 36px",position:"relative",overflow:"hidden"},
  bgCircle1:{position:"absolute",width:360,height:360,borderRadius:"50%",border:"1px solid rgba(255,255,255,.06)",top:-80,right:-80,pointerEvents:"none"},
  bgCircle2:{position:"absolute",width:280,height:280,borderRadius:"50%",border:"1px solid rgba(255,255,255,.05)",bottom:-60,left:-60,pointerEvents:"none"},
  leftInner:{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",position:"relative",zIndex:1,animation:"fadeSlideUp .7s ease"},
  logoWrap:{position:"relative",width:136,height:136,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:22},
  logoRing:{position:"absolute",inset:0,borderRadius:"50%",border:"1.5px dashed rgba(255,255,255,.22)",animation:"rotateRing 20s linear infinite"},
  logoFrame:{width:108,height:108,borderRadius:20,background:"transparent",overflow:"hidden",boxShadow:"0 10px 36px rgba(0,0,0,.4),0 0 0 4px rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center"},
  logoImg:{width:"100%",height:"100%",objectFit:"contain",padding:4},
  logoFallback:{width:"100%",height:"100%",alignItems:"center",justifyContent:"center",fontSize:52},
  instName:{color:"#fff",fontSize:24,fontWeight:700,fontFamily:"'Playfair Display',serif",letterSpacing:".5px",marginBottom:4},
  instFull:{color:"rgba(255,255,255,.58)",fontSize:12,letterSpacing:".3px",marginBottom:4},
  instEst:{color:"rgba(255,255,255,.36)",fontSize:11,letterSpacing:".5px",marginBottom:22},
  divider:{width:44,height:1,background:"rgba(255,255,255,.20)",borderRadius:1,marginBottom:22},
  botBadge:{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.10)",border:"1px solid rgba(255,255,255,.16)",borderRadius:24,padding:"7px 16px",color:"rgba(255,255,255,.88)",fontSize:12.5,fontWeight:500,marginBottom:22},
  liveIndicator:{width:7,height:7,borderRadius:"50%",background:"#4ade80",animation:"gentlePulse 2.4s infinite",display:"inline-block",flexShrink:0},
  deptGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,width:"100%",maxWidth:290,marginBottom:24},
  statsStrip:{display:"flex",width:"100%",maxWidth:290,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.11)",borderRadius:12,overflow:"hidden"},
  statCell:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 6px",borderRight:"1px solid rgba(255,255,255,.10)"},
  statNum:{color:"#fff",fontSize:16,fontWeight:700,marginBottom:2},
  statLbl:{color:"rgba(255,255,255,.45)",fontSize:10,letterSpacing:".4px"},
  right:{flex:1,background:"#edf1f7",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",overflowY:"auto"},
  card:{background:"#fff",borderRadius:20,boxShadow:"0 8px 48px rgba(0,42,107,.10)",padding:"34px 32px",width:"100%",maxWidth:420,animation:"fadeSlideUp .5s ease .1s both"},
  cardTop:{display:"flex",alignItems:"center",gap:14,marginBottom:24,paddingBottom:20,borderBottom:"1px solid #edf1f7"},
  cardLogoWrap:{width:52,height:52,borderRadius:12,background:"transparent",border:"1.5px solid #e2e8f0",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(0,42,107,.10)"},
  cardLogoImg:{width:"100%",height:"100%",objectFit:"contain",padding:4},
  cardLogoFallback:{width:"100%",height:"100%",alignItems:"center",justifyContent:"center",fontSize:26},
  cardTitle:{fontSize:20,fontWeight:700,color:"#0d1b2e",fontFamily:"'Playfair Display',serif",marginBottom:2},
  cardSub:{fontSize:12,color:"#7a8fa6"},
  tabsBar:{display:"flex",background:"#edf1f7",borderRadius:10,padding:4,marginBottom:22},
  field:{display:"flex",flexDirection:"column",gap:5,marginBottom:14},
  label:{fontSize:11,fontWeight:600,color:"#4a5568",letterSpacing:".5px",textTransform:"uppercase"},
  errorBox:{background:"#fff5f5",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#b91c1c",display:"flex",alignItems:"center",gap:8,marginBottom:10,marginTop:2},
  switchRow:{fontSize:12,color:"#7a8fa6",textAlign:"center",marginTop:14},
  adminNote:{marginTop:14,padding:"10px 14px",background:"#f0f7ff",borderRadius:8,fontSize:11.5,color:"#1d4ed8",border:"1px solid #bfdbfe",textAlign:"center",lineHeight:1.5},
  footer:{marginTop:22,fontSize:11,color:"#9aa5b1",textAlign:"center"},
};