import { useState, useEffect } from "react";

function getToken(){return localStorage.getItem("campusbot_token")||"";}

export default function AdminPortal({user, onLogout}){
  const [tab,setTab]=useState("overview");
  const [logs,setLogs]=useState([]);
  const [queries,setQueries]=useState([]);
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [replyId,setReplyId]=useState(null);
  const [replyTxt,setReplyTxt]=useState("");
  const [roleLoading,setRoleLoading]=useState({});
  const [sidebarOpen, setSidebarOpen]=useState(true);

  useEffect(()=>{
    const tok=getToken();
    fetch("http://localhost:5000/api/feedback/all",{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setLogs(Array.isArray(d)?d:[])).catch(()=>{});
    fetch("http://localhost:5000/api/fallback",{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>{setQueries(Array.isArray(d)?d:[]);setLoading(false);}).catch(()=>setLoading(false));
    fetch("http://localhost:5000/api/auth/users",{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setUsers(Array.isArray(d)?d:[])).catch(()=>{});
  },[]);

  const sendReply=async(id)=>{
    if(!replyTxt.trim())return;
    const r=await fetch(`http://localhost:5000/api/fallback/${id}/reply`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${getToken()}`},body:JSON.stringify({reply:replyTxt})});
    if(r.ok){setQueries(prev=>prev.map(q=>q._id===id?{...q,status:"replied",adminReply:replyTxt}:q));setReplyId(null);setReplyTxt("");}
  };

  const changeRole=async(userId,newRole)=>{
    setRoleLoading(p=>({...p,[userId]:true}));
    const r=await fetch(`http://localhost:5000/api/auth/users/${userId}/role`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${getToken()}`},body:JSON.stringify({role:newRole})});
    if(r.ok)setUsers(prev=>prev.map(u=>u._id===userId?{...u,role:newRole}:u));
    setRoleLoading(p=>({...p,[userId]:false}));
  };

  const pending=queries.filter(q=>q.status==="pending");
  const replied=queries.filter(q=>q.status==="replied");

  const navItems=[
    {id:"overview",icon:"📊",label:"Overview"},
    {id:"queries",icon:"📩",label:"Queries",badge:pending.length},
    {id:"users",icon:"👥",label:"Users"},
    {id:"history",icon:"💬",label:"Chat History"},
  ];

  return(
    <div style={ap.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#e0e0e0;border-radius:4px}
        button{cursor:pointer;font-family:'Inter',sans-serif;}
        button:hover{opacity:.9;}
      `}</style>

      {/* ── ADMIN SIDEBAR ── */}
      <div style={ap.sidebar}>
        {/* Logo */}
        <div style={ap.sidebarHeader}>
          <img src="/bits-logo.png" alt="BITS" style={ap.logo} onError={e=>{e.target.style.display="none";}}/>
          <div>
            <div style={ap.logoName}>BITS Pilani</div>
            <div style={ap.logoSub}>Admin Portal</div>
          </div>
        </div>

        {/* Admin user info */}
        <div style={ap.adminBadge}>
          <div style={ap.adminAvatar}>{user?.name?.[0]?.toUpperCase()||"A"}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={ap.adminName}>{user?.name}</div>
            <div style={ap.adminRole}>🔑 Administrator</div>
          </div>
        </div>

        {/* Nav */}
        <div style={ap.navSection}>
          <div style={ap.navLabel}>MANAGEMENT</div>
          {navItems.map(item=>(
            <button key={item.id} style={{...ap.navBtn,...(tab===item.id?ap.navBtnActive:{})}} onClick={()=>setTab(item.id)}>
              <span style={ap.navIcon}>{item.icon}</span>
              <span style={ap.navText}>{item.label}</span>
              {item.badge>0&&<span style={ap.navBadge}>{item.badge}</span>}
            </button>
          ))}
        </div>

        <div style={ap.navSection}>
          <div style={ap.navLabel}>QUICK ACTIONS</div>
          <a href="http://localhost:5000/api/feedback/csv" download style={ap.csvBtn}>
            ⬇️ Download CSV
          </a>
        </div>

        {/* Logout */}
        <div style={ap.sidebarFooter}>
          <button style={ap.logoutBtn} onClick={onLogout}>
            ⎋ Sign Out
          </button>
        </div>
      </div>

      {/* ── ADMIN MAIN ── */}
      <div style={ap.main}>
        {/* Top bar */}
        <div style={ap.topbar}>
          <div style={ap.topbarTitle}>
            {navItems.find(n=>n.id===tab)?.icon} {navItems.find(n=>n.id===tab)?.label}
          </div>
          <div style={ap.topbarRight}>
            <span style={ap.topbarDate}>{new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</span>
          </div>
        </div>

        <div style={ap.content}>

          {/* ── OVERVIEW ── */}
          {tab==="overview"&&(
            <div style={{animation:"fadeIn .3s ease"}}>
              <div style={ap.statsGrid}>
                {[
                  {label:"Total Queries",value:queries.length,icon:"📩",color:"#6c5ce7",bg:"#f0eeff",border:"#d0c8ff"},
                  {label:"Pending",value:pending.length,icon:"🟡",color:"#e67e22",bg:"#fff8ec",border:"#fde8c0"},
                  {label:"Resolved",value:replied.length,icon:"✅",color:"#00b894",bg:"#ecfdf5",border:"#bbf7d0"},
                  {label:"Total Users",value:users.length,icon:"👥",color:"#0984e3",bg:"#e8f4fd",border:"#bfdbfe"},
                  {label:"Chat Logs",value:logs.length,icon:"💬",color:"#636e72",bg:"#f8f9fa",border:"#e2e8f0"},
                  {label:"Helpful Ratings",value:logs.filter(l=>l.feedback==="up").length,icon:"👍",color:"#00b894",bg:"#ecfdf5",border:"#bbf7d0"},
                ].map(stat=>(
                  <div key={stat.label} style={{...ap.statCard,background:stat.bg,borderColor:stat.border}}>
                    <div style={ap.statIcon}>{stat.icon}</div>
                    <div style={{...ap.statValue,color:stat.color}}>{stat.value}</div>
                    <div style={ap.statLabel}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Feedback chart */}
              {logs.length>0&&(
                <div style={ap.chartCard}>
                  <div style={ap.chartTitle}>📊 Feedback Overview</div>
                  <div style={ap.chartBars}>
                    {[
                      {label:"👍 Helpful",count:logs.filter(l=>l.feedback==="up").length,color:"#00b894"},
                      {label:"👎 Not Helpful",count:logs.filter(l=>l.feedback==="down").length,color:"#e17055"},
                      {label:"— No Rating",count:logs.filter(l=>!l.feedback).length,color:"#b2bec3"},
                    ].map(bar=>{
                      const pct=logs.length?Math.round((bar.count/logs.length)*100):0;
                      return(
                        <div key={bar.label} style={{flex:1}}>
                          <div style={ap.barLabel}>{bar.label} ({bar.count})</div>
                          <div style={ap.barTrack}>
                            <div style={{...ap.barFill,width:`${pct}%`,background:bar.color}}/>
                          </div>
                          <div style={{...ap.barPct,color:bar.color}}>{pct}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent pending queries */}
              {pending.length>0&&(
                <div style={ap.recentSection}>
                  <div style={ap.sectionTitle}>🟡 Recent Pending Queries</div>
                  {pending.slice(0,3).map(q=>(
                    <div key={q._id} style={ap.miniQueryCard}>
                      <div style={ap.miniQueryMeta}>
                        <span style={ap.miniQueryUser}>👤 {q.userName}</span>
                        <span style={ap.miniQueryTime}>{new Date(q.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={ap.miniQueryText}>"{q.query}"</div>
                      <button style={ap.miniReplyBtn} onClick={()=>{setTab("queries");setReplyId(q._id);}}>Reply →</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── QUERIES ── */}
          {tab==="queries"&&(
            <div style={{animation:"fadeIn .3s ease"}}>
              {/* Filter tabs */}
              <div style={ap.filterRow}>
                {[
                  {label:`All (${queries.length})`,filter:"all"},
                  {label:`Pending (${pending.length})`,filter:"pending"},
                  {label:`Replied (${replied.length})`,filter:"replied"},
                ].map(f=>(
                  <button key={f.filter} style={ap.filterBtn}>{f.label}</button>
                ))}
              </div>

              {loading?<p style={{color:"#b2bec3",padding:20}}>Loading...</p>:
              queries.length===0?<div style={ap.emptyState}><div style={{fontSize:40,marginBottom:12}}>📭</div><div>No queries submitted yet.</div></div>:
              queries.map(q=>(
                <div key={q._id} style={{...ap.queryCard,...(q.status==="replied"?ap.queryCardReplied:{})}}>
                  <div style={ap.queryCardHeader}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{...ap.statusBadge,...(q.status==="replied"?ap.statusReplied:ap.statusPending)}}>
                        {q.status==="replied"?"✅ Replied":"🟡 Pending"}
                      </span>
                      <span style={ap.queryCardTime}>{new Date(q.createdAt).toLocaleString()}</span>
                    </div>
                    <span style={ap.queryLang}>🌐 {q.lang==="hi"?"Hindi":"English"}</span>
                  </div>
                  <div style={ap.queryCardUser}>
                    <span>👤 <strong>{q.userName}</strong></span>
                    <span style={{margin:"0 8px",color:"#eee"}}>·</span>
                    <span>📧 {q.userEmail}</span>
                    {q.preferredTime&&<><span style={{margin:"0 8px",color:"#eee"}}>·</span><span>⏰ {q.preferredTime}</span></>}
                  </div>
                  <div style={ap.queryCardText}>"{q.query}"</div>

                  {q.adminReply&&(
                    <div style={ap.adminReplyBox}>
                      <div style={ap.adminReplyLabel}>Your Reply:</div>
                      <div style={ap.adminReplyText}>{q.adminReply}</div>
                    </div>
                  )}

                  {q.status==="pending"&&replyId!==q._id&&(
                    <button style={ap.replyTriggerBtn} onClick={()=>{setReplyId(q._id);setReplyTxt("");}}>
                      ✉️ Reply to this query
                    </button>
                  )}
                  {replyId===q._id&&(
                    <div style={ap.replyForm}>
                      <textarea style={ap.replyInput} rows={3} placeholder="Type your reply..." value={replyTxt} onChange={e=>setReplyTxt(e.target.value)}/>
                      <div style={{display:"flex",gap:8,marginTop:8}}>
                        <button style={ap.sendReplyBtn} onClick={()=>sendReply(q._id)}>Send Reply →</button>
                        <button style={ap.cancelReplyBtn} onClick={()=>setReplyId(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── USERS ── */}
          {tab==="users"&&(
            <div style={{animation:"fadeIn .3s ease"}}>
              <p style={{fontSize:13,color:"#636e72",marginBottom:16}}>All registered users — change their role here.</p>
              {users.length===0?<div style={ap.emptyState}><div style={{fontSize:40,marginBottom:12}}>👥</div><div>No users found.</div></div>:
              users.map(u=>(
                <div key={u._id} style={ap.userCard}>
                  <div style={{...ap.userAvatar,background:u.role==="admin"?"linear-gradient(135deg,#f59e0b,#d97706)":"linear-gradient(135deg,#6c5ce7,#a29bfe)"}}>
                    {u.name?.[0]?.toUpperCase()||"U"}
                  </div>
                  <div style={{flex:1}}>
                    <div style={ap.userName}>{u.name}</div>
                    <div style={ap.userEmail}>{u.email}</div>
                    <div style={{fontSize:11,color:"#b2bec3"}}>Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={ap.roleToggle}>
                    <button style={{...ap.roleBtn,...(u.role==="user"?ap.roleBtnUser:{})}} onClick={()=>u.role!=="user"&&changeRole(u._id,"user")} disabled={roleLoading[u._id]||u.role==="user"}>
                      🎓 Student
                    </button>
                    <button style={{...ap.roleBtn,...(u.role==="admin"?ap.roleBtnAdmin:{})}} onClick={()=>u.role!=="admin"&&changeRole(u._id,"admin")} disabled={roleLoading[u._id]||u.role==="admin"}>
                      🔑 Admin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── CHAT HISTORY ── */}
          {tab==="history"&&(
            <div style={{animation:"fadeIn .3s ease",overflowX:"auto"}}>
              <table style={ap.table}>
                <thead>
                  <tr>{["Time","Lang","User Message","Bot Reply","Feedback","Comment"].map(h=><th key={h} style={ap.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {logs.map((log,i)=>(
                    <tr key={i} style={{background:i%2===0?"#f8f9fa":"#fff"}}>
                      <td style={ap.td}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={ap.td}><span style={{...ap.langTag,background:log.lang==="hi"?"#fff8ec":"#e8f4fd",color:log.lang==="hi"?"#e67e22":"#0984e3"}}>{log.lang==="hi"?"🇮🇳 Hindi":"🌐 English"}</span></td>
                      <td style={ap.td}>{log.userMsg}</td>
                      <td style={ap.td}>{log.botReply?.slice(0,80)}...</td>
                      <td style={{...ap.td,textAlign:"center"}}>{log.feedback==="up"?"👍":log.feedback==="down"?"👎":"—"}</td>
                      <td style={ap.td}>{log.comment||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length===0&&<div style={ap.emptyState}><div style={{fontSize:40,marginBottom:12}}>💬</div><div>No chat logs yet.</div></div>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const ap={
  root:{display:"flex",height:"100vh",fontFamily:"'Inter',sans-serif",background:"#f0f2f5",overflow:"hidden"},

  /* Sidebar */
  sidebar:{width:240,background:"#fff",borderRight:"1px solid #eee",display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto"},
  sidebarHeader:{display:"flex",alignItems:"center",gap:10,padding:"20px 16px 16px",borderBottom:"1px solid #f0f0f0"},
  logo:{width:36,height:36,objectFit:"contain",borderRadius:8,flexShrink:0},
  logoName:{fontSize:13,fontWeight:700,color:"#001a4d",letterSpacing:.3},
  logoSub:{fontSize:10,color:"#b2bec3",fontWeight:500},
  adminBadge:{display:"flex",alignItems:"center",gap:10,margin:"12px 16px",background:"linear-gradient(135deg,#fefce8,#fff8e1)",borderRadius:12,padding:"10px 12px",border:"1px solid #fde68a"},
  adminAvatar:{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,flexShrink:0},
  adminName:{fontSize:12,fontWeight:600,color:"#1a1a2e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},
  adminRole:{fontSize:10,color:"#d97706",fontWeight:600,marginTop:1},
  navSection:{padding:"8px 10px"},
  navLabel:{fontSize:9,fontWeight:700,color:"#b2bec3",letterSpacing:1.2,marginBottom:6,marginLeft:6,marginTop:4},
  navBtn:{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",borderRadius:10,border:"none",background:"transparent",fontSize:13,color:"#636e72",fontWeight:500,marginBottom:2,textAlign:"left",transition:"all .15s"},
  navBtnActive:{background:"#f0eeff",color:"#6c5ce7",fontWeight:700},
  navIcon:{fontSize:15,flexShrink:0},
  navText:{flex:1},
  navBadge:{background:"#e17055",color:"#fff",borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0},
  csvBtn:{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:10,background:"#f0fff4",color:"#00b894",fontSize:13,fontWeight:600,textDecoration:"none",border:"1px solid #bbf7d0",margin:"0 2px"},
  sidebarFooter:{marginTop:"auto",padding:"12px 16px",borderTop:"1px solid #f0f0f0"},
  logoutBtn:{width:"100%",padding:"9px",borderRadius:10,border:"1.5px solid #fee2e2",background:"#fff5f5",color:"#e17055",fontSize:12,fontWeight:600},

  /* Main */
  main:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"},
  topbar:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 28px",background:"#fff",borderBottom:"1px solid #eee",flexShrink:0},
  topbarTitle:{fontSize:18,fontWeight:700,color:"#1a1a2e",display:"flex",alignItems:"center",gap:8},
  topbarRight:{display:"flex",alignItems:"center",gap:12},
  topbarDate:{fontSize:12,color:"#b2bec3"},
  content:{flex:1,overflowY:"auto",padding:"24px 28px", background:"linear-gradient(rgba(240,242,245,0.95),rgba(240,242,245,0.95)),url('/bits-logo.png') center/300px no-repeat fixed"},

  /* Stats */
  statsGrid:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20},
  statCard:{borderRadius:14,padding:"18px 16px",border:"1.5px solid",display:"flex",flexDirection:"column",gap:4},
  statIcon:{fontSize:22,marginBottom:4},
  statValue:{fontSize:28,fontWeight:700},
  statLabel:{fontSize:11,color:"#636e72",fontWeight:500},

  /* Chart */
  chartCard:{background:"#fff",borderRadius:14,padding:"18px 20px",marginBottom:20,boxShadow:"0 1px 6px rgba(0,0,0,.06)"},
  chartTitle:{fontSize:14,fontWeight:700,color:"#2d3436",marginBottom:16},
  chartBars:{display:"flex",gap:16},
  barLabel:{fontSize:11,color:"#636e72",marginBottom:6},
  barTrack:{background:"#f0f0f0",borderRadius:20,height:8,overflow:"hidden"},
  barFill:{height:"100%",borderRadius:20,transition:"width .5s"},
  barPct:{fontSize:11,marginTop:4,fontWeight:600},

  /* Recent */
  recentSection:{background:"#fff",borderRadius:14,padding:"18px 20px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"},
  sectionTitle:{fontSize:14,fontWeight:700,color:"#2d3436",marginBottom:14},
  miniQueryCard:{background:"#f8f9fa",borderRadius:10,padding:"12px 14px",marginBottom:10,borderLeft:"3px solid #fdcb6e"},
  miniQueryMeta:{display:"flex",justifyContent:"space-between",marginBottom:6},
  miniQueryUser:{fontSize:12,fontWeight:600,color:"#2d3436"},
  miniQueryTime:{fontSize:11,color:"#b2bec3"},
  miniQueryText:{fontSize:13,color:"#636e72",fontStyle:"italic",marginBottom:8},
  miniReplyBtn:{padding:"5px 14px",borderRadius:8,border:"1.5px solid #6c5ce7",background:"#f0eeff",color:"#6c5ce7",fontSize:11,fontWeight:600},

  /* Query cards */
  filterRow:{display:"flex",gap:8,marginBottom:16},
  filterBtn:{padding:"7px 16px",borderRadius:20,border:"1.5px solid #eee",background:"#fff",color:"#636e72",fontSize:12,fontWeight:600},
  emptyState:{textAlign:"center",padding:"60px 20px",color:"#b2bec3",fontSize:14},
  queryCard:{background:"#fff",borderRadius:14,padding:"18px 20px",marginBottom:12,boxShadow:"0 1px 6px rgba(0,0,0,.06)",borderLeft:"4px solid #fdcb6e"},
  queryCardReplied:{borderLeftColor:"#00b894",background:"#fafffe"},
  queryCardHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10},
  statusBadge:{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20},
  statusPending:{background:"#fff8ec",color:"#e67e22",border:"1px solid #fde8c0"},
  statusReplied:{background:"#ecfdf5",color:"#00b894",border:"1px solid #bbf7d0"},
  queryCardTime:{fontSize:11,color:"#b2bec3"},
  queryLang:{fontSize:11,color:"#636e72",background:"#f0f2f5",padding:"3px 8px",borderRadius:8},
  queryCardUser:{fontSize:12,color:"#636e72",marginBottom:10,display:"flex",flexWrap:"wrap",gap:4},
  queryCardText:{fontSize:14,color:"#2d3436",fontStyle:"italic",lineHeight:1.6,marginBottom:12,background:"#f8f9fa",borderRadius:8,padding:"10px 14px"},
  adminReplyBox:{background:"#f0f9ff",borderRadius:10,padding:"10px 14px",marginBottom:12,borderLeft:"3px solid #0984e3"},
  adminReplyLabel:{fontSize:11,fontWeight:700,color:"#0984e3",marginBottom:4},
  adminReplyText:{fontSize:13,color:"#2d3436",lineHeight:1.5},
  replyTriggerBtn:{padding:"8px 18px",borderRadius:10,border:"1.5px solid #6c5ce7",background:"#f0eeff",color:"#6c5ce7",fontSize:12,fontWeight:600},
  replyForm:{marginTop:10},
  replyInput:{width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #eee",fontSize:13,fontFamily:"'Inter',sans-serif",resize:"vertical",outline:"none"},
  sendReplyBtn:{padding:"9px 20px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#6c5ce7,#a29bfe)",color:"#fff",fontSize:12,fontWeight:600},
  cancelReplyBtn:{padding:"9px 16px",borderRadius:10,border:"1px solid #eee",background:"#fff",color:"#636e72",fontSize:12},

  /* Users */
  userCard:{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:12,padding:"14px 16px",marginBottom:10,boxShadow:"0 1px 4px rgba(0,0,0,.06)"},
  userAvatar:{width:42,height:42,borderRadius:"50%",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:700,flexShrink:0},
  userName:{fontSize:14,fontWeight:600,color:"#2d3436"},
  userEmail:{fontSize:12,color:"#636e72",marginBottom:2},
  roleToggle:{display:"flex",gap:6},
  roleBtn:{padding:"6px 14px",borderRadius:20,border:"1.5px solid #eee",background:"#f8f9fa",color:"#636e72",fontSize:11,fontWeight:600,transition:"all .2s"},
  roleBtnUser:{background:"#f0eeff",color:"#6c5ce7",borderColor:"#6c5ce7"},
  roleBtnAdmin:{background:"#fef3c7",color:"#d97706",borderColor:"#f59e0b"},

  /* Table */
  table:{width:"100%",borderCollapse:"collapse",fontSize:12,background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,.06)"},
  th:{background:"#6c5ce7",color:"#fff",padding:"10px 14px",textAlign:"left",whiteSpace:"nowrap",fontSize:11},
  td:{padding:"9px 14px",borderBottom:"1px solid #eee",color:"#2d3436",verticalAlign:"top",maxWidth:200,wordBreak:"break-word"},
  langTag:{padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:600},
};