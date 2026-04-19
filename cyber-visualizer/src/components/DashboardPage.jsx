import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, Activity, User, Mail, Clock, Search, Trash2, Server, Fingerprint, Globe, Smartphone, CreditCard, Wifi, X, Filter, Calendar, LayoutTemplate, Lock, TrendingUp, CheckCircle, Bell, MapPin, Loader2 } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RT, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { useTheme } from "../ThemeContext";

const PIE_COLORS=["#0ea5e9","#6366f1","#8b5cf6","#10b981","#eab308","#ec4899"];
const PREVENTION={EMAIL:["Monitor financial transactions linked to this email.","Enable Two-Factor Authentication (2FA) immediately.","Check connected OAuth apps for unauthorised access.","Avoid sending OTPs or sensitive data via email replies."],PHONE:["Never share OTPs or banking PINs over phone calls.","Beware of SMS phishing (Smishing) short links.","Register your number on the TRAI DND registry.","Contact your carrier to prevent SIM-swap attacks."],AADHAAR:["Lock Aadhaar biometrics via the mAadhaar app.","Use Virtual ID (VID) instead of your real Aadhaar number.","Review Aadhaar auth history for anomalies.","Never share unmasked photocopies of your Aadhaar."],PAN:["Monitor CIBIL/Experian report for unknown loans.","Check ITR filings for unauthorised returns.","Avoid sharing PAN on untrusted websites.","Report misuse to NSDL and IT Department."],IP:["Restart your router to get a fresh dynamic IP.","Use a reputable no-log VPN to mask all traffic.","Update router firmware and change default credentials.","Run a full malware scan on all devices."],URL:["Do not enter credentials on this domain.","Report URL to Google Safe Browsing and PhishTank.","Ensure browser phishing protection is on.","Clear browser cache, cookies, and site storage."]};

const fmtDate=iso=>new Date(iso).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
const hashQuery=(q="",type="")=>{
  if(!q) return "••••••••";
  if(type==="EMAIL"){const [u,d]=q.split("@");return u.slice(0,2)+"•".repeat(Math.max(2,u.length-2))+"@"+(d||"•••");}
  if(type==="PHONE") return q.slice(0,2)+"••••••"+q.slice(-2);
  if(type==="AADHAAR") return "••••"+q.slice(4,8).replace(/./g,"•")+"••••";
  if(type==="PAN") return q.slice(0,3)+"•".repeat(4)+q.slice(-3);
  if(type==="IP") return q.split(".").map((s,i)=>i===0||i===3?s:"•••").join(".");
  if(type==="URL"){try{const u=new URL(q.startsWith("http")?q:"https://"+q);return u.hostname.replace(/^[^.]+/,m=>m.slice(0,2)+"•".repeat(m.length-2));}catch{return q.slice(0,4)+"•••"+q.slice(-4);}}
  return q.slice(0,2)+"•".repeat(Math.max(2,q.length-4))+q.slice(-2);
};
const normalizeStatus=(status="")=>{
  const upper=String(status||"").trim().toUpperCase();
  if(upper==="EXPOSED"||upper==="THREAT") return "EXPOSED";
  return "SAFE";
};
const toCompromisedList=(value,safe)=>{
  if(Array.isArray(value)){
    const cleaned=value.map(v=>String(v||"").trim()).filter(Boolean);
    if(cleaned.length>0) return cleaned;
  }
  if(typeof value==="string"){
    const cleaned=value.split(",").map(v=>v.trim()).filter(Boolean);
    if(cleaned.length>0) return cleaned;
  }
  if(value&&typeof value==="object"){
    const cleaned=Object.values(value).map(v=>String(v||"").trim()).filter(Boolean);
    if(cleaned.length>0) return cleaned;
  }
  return safe?["None"]:["Archived Threat Data"];
};
const normalizeHistoryRecord=(record,index)=>{
  const timestamp=record.timestamp||record.updatedAt||record.scanDate||new Date().toISOString();
  const type=String(record.type||"").toUpperCase();
  const query=record.query||record.identifier||"";
  const severityRaw=record.severityScore ?? record.risk ?? record.riskScore ?? 0;
  const numericSeverity=Number(severityRaw);

  return {
    ...record,
    id: record.id || `${type || "SCAN"}-${timestamp}-${index}`,
    type,
    query,
    identifier: record.identifier || query,
    timestamp,
    status: normalizeStatus(record.status),
    severityScore: Number.isFinite(numericSeverity) ? numericSeverity : 0,
    breachName: record.breachName || "-",
    compromisedData: record.compromisedData || "None"
  };
};
const TypeIcon=({type,size=13})=>({EMAIL:<Mail size={size} style={{color:"#0ea5e9"}}/>,URL:<Globe size={size} style={{color:"#6366f1"}}/>,IP:<Wifi size={size} style={{color:"#22d3ee"}}/>,PHONE:<Smartphone size={size} style={{color:"#10b981"}}/>,AADHAAR:<Shield size={size} style={{color:"#f97316"}}/>,PAN:<CreditCard size={size} style={{color:"#eab308"}}/>}[type]||<Search size={size} style={{color:"var(--text-muted)"}}/>);

export default function DashboardPage({setIsModalOpen}) {
  const {dark} = useTheme();
  const [user,setUser]=useState(null);
  const [history,setHistory]=useState([]);
  const [stats,setStats]=useState({total:0,exposed:0,safe:0,riskScore:100,typeData:[],timelineData:[]});
  const [sel,setSel]=useState(null);
  const [modalPreparing,setModalPreparing]=useState(false);

  const [enrichedData, setEnrichedData] = useState(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const API = import.meta?.env?.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    if (u) {
      setUser(u);
      const raw = JSON.parse(localStorage.getItem(`search_history_${u.email}`) || "[]");
      const normalized = raw.map((entry,index)=>normalizeHistoryRecord(entry,index));
      setHistory(normalized);
      calc(normalized);
    }
  }, []);

  useEffect(()=>{if(setIsModalOpen)setIsModalOpen(!!sel);},[sel,setIsModalOpen]);
  useEffect(()=>{const fn=e=>{if(e.key==="Escape")setSel(null);};window.addEventListener("keydown",fn);return()=>window.removeEventListener("keydown",fn);},[]);

  useEffect(() => {
    let timer;
    if (sel) {
      setModalPreparing(true);
      timer = setTimeout(() => setModalPreparing(false), 140);
    } else {
      setModalPreparing(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [sel]);

  useEffect(() => {
    if (sel && sel.type === "IP") {
      setIsEnriching(true);
      setEnrichedData(null);
      const targetIp = sel.query || sel.identifier || "";
      fetch(`${API}/api/enrich/${targetIp}`)
        .then(res => res.json())
        .then(data => { setEnrichedData(data); setIsEnriching(false); })
        .catch(err => { console.error("IP Enrichment Failed:", err); setIsEnriching(false); });
    }
  }, [sel, API]);

  const calc=data=>{
    const exp=data.filter(d=>normalizeStatus(d.status)==="EXPOSED").length;
    const saf=data.filter(d=>normalizeStatus(d.status)==="SAFE").length;
    const risk=!data.length?100:Math.max(0,Math.round(100-(exp/data.length)*100));
    const tc={};data.forEach(d=>{tc[d.type]=(tc[d.type]||0)+1;});
    const typeData=Object.keys(tc).map(k=>({name:k,value:tc[k]}));
    const dc={};data.forEach(d=>{const l=new Date(d.timestamp).toLocaleDateString("en-IN",{month:"short",day:"numeric"});dc[l]=(dc[l]||0)+1;});
    const timelineData=Object.keys(dc).slice(-7).map(d=>({date:d,scans:dc[d]}));
    setStats({total:data.length,exposed:exp,safe:saf,riskScore:risk,typeData,timelineData});
  };

  const handleClear=()=>{
    if(!window.confirm("Purge entire intelligence ledger?"))return;
    localStorage.removeItem(`search_history_${user.email}`);
    setHistory([]);
    calc([]);
  };

  const modal=sel?(()=>{
    const safe=normalizeStatus(sel.status)==="SAFE";const score=safe?0:parseInt(sel.severityScore||85,10);
    const list=toCompromisedList(sel.compromisedData,safe);
    let level="SAFE",rc="#22c55e",gc="#22c55e";
    if(!safe){if(score<40){level="LOW";rc="#eab308";gc="#eab308";}else if(score<75){level="MEDIUM";rc="#f97316";gc="#f97316";}else{level="CRITICAL";rc="#f43f5e";gc="#f43f5e";}}
    return {safe,score,list,level,rc,gc,source:sel.source||(safe?"Clean":"Unknown"),breach:sel.breachName||(safe?"None":"Unknown"),scanDate:fmtDate(sel.timestamp)};
  })():null;

  if(!user) return null;

  const dn=user.name||user.email?.split("@")[0]||"Analyst";
  const identityLabel=(user.clearance||user.role||"standard").toString().replace(/_/g," ");
  const gR=40,gC=2*Math.PI*gR,gOff=gC-(stats.riskScore/100)*gC;
  const gCol=stats.riskScore>80?"#22c55e":stats.riskScore>50?"#eab308":"#f43f5e";
  
  const calculateSeverityBars = () => {
    let crit=0, high=0, med=0, low=0;
    history.filter(h => normalizeStatus(h.status) === "EXPOSED").forEach(h => {
      const s = parseInt(h.severityScore || 85);
      if(s >= 75) crit++;
      else if(s >= 50) high++;
      else if(s >= 40) med++;
      else low++;
    });
    return [
      {label:"Critical",value:crit,color:"#f43f5e"},
      {label:"High",value:high,color:"#f97316"},
      {label:"Medium",value:med,color:"#eab308"},
      {label:"Low",value:low,color:"#22c55e"}
    ];
  };
  const dynamicSevBars = calculateSeverityBars();

  const ax=dark?"#2a4a63":"#6a9aba";
  const tip={background:dark?"#060d1f":"#fff",border:"1px solid var(--border-glow)",borderRadius:10,fontFamily:"IBM Plex Mono",fontSize:11};
  const div="border-b" + (dark?" border-slate-800/40":" border-blue-100/80");
  const stagger={hidden:{opacity:0},visible:{opacity:1,transition:{staggerChildren:.06}}};
  const fUp={hidden:{opacity:0,y:14},visible:{opacity:1,y:0,transition:{type:"spring",stiffness:300,damping:24}}};
  const modalShellClass = dark
    ? "bg-slate-950/95 border-slate-700/80 text-slate-100"
    : "bg-white/94 border-slate-200 text-slate-900";
  const modalPanelClass = dark
    ? "border-slate-700 bg-slate-900/75 shadow-[0_18px_50px_rgba(0,0,0,.25)]"
    : "border-slate-200 bg-white/90 shadow-sm";
  const modalMutedClass = dark ? "text-slate-300" : "text-slate-600";
  const modalSubtleClass = dark ? "text-slate-400" : "text-slate-500";

  return (
    <>
    <motion.div variants={stagger} initial="hidden" animate="visible" className="flex-1 w-full flex flex-col px-4 sm:px-6 md:px-10 py-5 overflow-y-auto relative z-10" style={{scrollbarWidth:"thin",fontFamily:"'DM Sans',sans-serif",color:"var(--text-primary)"}}>
      
      <motion.div variants={fUp} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 ${div}`}>
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
              <h1 className="text-2xl font-bold" style={{color:"var(--text-primary)"}}>
              <span className="bg-[linear-gradient(to_right,#ff8a00,#e5b061,#72aeb6,#0ea5e9)] bg-clip-text text-transparent">Cyber Attack Visualizer</span>{" "}
              <span style={{background:"linear-gradient(90deg,#0ea5e9,#6366f1)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Dashboard</span>
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full" style={{fontFamily:"IBM Plex Mono",fontSize:9,fontWeight:700,letterSpacing:".12em",color:"#22c55e",background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.22)"}}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 blink inline-block"/> LIVE
            </span>
          </div>
          <p className="text-sm" style={{color:"var(--text-muted)"}}>Cyber-intelligence overview · Personal scan records</p>
        </div>
      </motion.div>

      <motion.div variants={fUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[{label:"Total Scans",value:stats.total,sub:"all time",icon:Search,color:"#0ea5e9"},{label:"Exposed",value:stats.exposed,sub:`${stats.total?Math.round(stats.exposed/stats.total*100):0}% rate`,icon:AlertTriangle,color:"#f43f5e"},{label:"Safe",value:stats.safe,sub:"no threats",icon:CheckCircle,color:"#22c55e"},{label:"Safety Index",value:stats.riskScore,sub:stats.riskScore>80?"Optimal":stats.riskScore>50?"Warning":"Critical",icon:Shield,color:gCol}].map(s=>{
          const Icon=s.icon;
          return(
            <motion.div key={s.label} whileHover={{y:-2,scale:1.02}} className="glass flex items-center gap-3.5 p-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:`${s.color}12`,border:`1px solid ${s.color}28`}}><Icon size={18} style={{color:s.color}}/></div>
              <div className="min-w-0">
                <div className="font-bold text-xl leading-tight stat-val" style={{fontFamily:"IBM Plex Mono"}}>{s.value}</div>
                <div className="text-[11px] leading-tight truncate" style={{color:"var(--text-muted)"}}>{s.label}</div>
                <div className="text-[10px] leading-tight" style={{fontFamily:"IBM Plex Mono",color:"var(--text-faint)"}}>{s.sub}</div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div variants={fUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 mb-4">
        <div className="lg:col-span-4 glass p-5 flex items-center gap-4 relative overflow-hidden">
          <div style={{position:"absolute",top:0,right:0,width:"45%",height:"100%",background:"radial-gradient(ellipse at top right,rgba(14,165,233,.04) 0%,transparent 70%)",pointerEvents:"none"}}/>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{background:"linear-gradient(135deg,rgba(14,165,233,.12),rgba(99,102,241,.12))",border:"1px solid rgba(14,165,233,.2)"}}><User size={24} style={{color:"var(--accent)"}}/></div>
          <div className="flex-1 min-w-0 z-10">
            <h2 className="text-base font-bold truncate" style={{color:"var(--text-primary)"}}>{user.name||"Analyst Profile"}</h2>
            <div className="flex items-center gap-1.5 mb-1.5" style={{fontFamily:"IBM Plex Mono",fontSize:11,color:"var(--text-muted)"}}><Mail size={10} style={{color:"var(--accent)",flexShrink:0}}/><span className="truncate">{user.email}</span></div>
            <div className="flex items-center gap-3" style={{fontFamily:"IBM Plex Mono",fontSize:10,color:"var(--text-faint)"}}><span className="flex items-center gap-1"><Fingerprint size={10} style={{color:"#8b5cf6"}}/>{identityLabel}</span><span className="flex items-center gap-1"><MapPin size={10} style={{color:"#f43f5e"}}/>India</span></div>
          </div>
        </div>

        <div className="lg:col-span-3 glass p-5 flex flex-col items-center justify-center">
          <p style={{fontFamily:"IBM Plex Mono",fontSize:10,color:"var(--text-muted)",letterSpacing:".12em",textTransform:"uppercase"}} className="mb-3">Safety Index</p>
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg viewBox="0 0 112 112" className="w-full h-full -rotate-90">
              <circle cx="56" cy="56" r={gR} stroke={dark?"#1e293b":"#e2e8f0"} strokeWidth="7" fill="none"/>
              <circle cx="56" cy="56" r={gR} stroke={gCol} strokeWidth="7" fill="none" strokeDasharray={gC} strokeDashoffset={gOff} strokeLinecap="round" className="transition-all duration-1000 ease-out" style={{filter:`drop-shadow(0 0 8px ${gCol})`}}/>
            </svg>
            <div className="absolute flex flex-col items-center"><span className="font-black text-3xl leading-none stat-val" style={{fontFamily:"IBM Plex Mono"}}>{stats.riskScore}</span></div>
          </div>
          <span className="font-bold px-3 py-1 rounded-full border mt-2" style={{fontFamily:"IBM Plex Mono",fontSize:10,color:gCol,borderColor:gCol+"40",background:gCol+"0e"}}>{stats.riskScore>80?"Optimal":stats.riskScore>50?"Warning":"Critical"}</span>
        </div>

        <div className="lg:col-span-5 sm:col-span-2 glass p-5 flex flex-col">
          <div className={`flex items-center gap-2 mb-3 pb-3 ${div}`}>
            <TrendingUp size={13} style={{color:"#f97316"}}/><span style={{fontFamily:"IBM Plex Mono",fontSize:11,fontWeight:600,letterSpacing:".08em",color:"var(--text-secondary)",textTransform:"uppercase"}}>Severity Breakdown</span>
          </div>
          <div className="flex-1" style={{minHeight:90}}>
            {history.filter(h => normalizeStatus(h.status) === "EXPOSED").length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicSevBars} margin={{top:4,right:0,left:-28,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark?"rgba(56,189,248,.05)":"rgba(3,105,161,.07)"} vertical={false}/>
                  <XAxis dataKey="label" tick={{fill:ax,fontSize:10,fontFamily:"IBM Plex Mono"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:ax,fontSize:10,fontFamily:"IBM Plex Mono"}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <RT contentStyle={tip}/>
                  <Bar dataKey="value" radius={[4,4,0,0]}>{dynamicSevBars.map((e,i)=><Cell key={i} fill={e.color}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-500 font-mono">No exposures detected</div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fUp} className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4">
        <div className="lg:col-span-8 glass p-5 flex flex-col" style={{minHeight:220}}>
          <div className={`flex items-center justify-between mb-3 pb-3 ${div}`}>
            <div className="flex items-center gap-2"><Activity size={13} style={{color:"var(--accent)"}}/><span style={{fontFamily:"IBM Plex Mono",fontSize:11,fontWeight:600,letterSpacing:".08em",color:"var(--text-secondary)",textTransform:"uppercase"}}>Scan Activity</span></div>
            <span style={{fontFamily:"IBM Plex Mono",fontSize:9,color:"var(--text-faint)",border:"1px solid var(--border)",borderRadius:6,padding:"2px 8px"}}>Recent</span>
          </div>
          <div className="flex-1">
            {stats.timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.timelineData} margin={{top:6,right:2,left:-28,bottom:0}}>
                  <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0ea5e9" stopOpacity={dark?.22:.14}/><stop offset="100%" stopColor="#0ea5e9" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark?"rgba(56,189,248,.05)":"rgba(3,105,161,.07)"}/>
                  <XAxis dataKey="date" tick={{fill:ax,fontSize:10,fontFamily:"IBM Plex Mono"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:ax,fontSize:10,fontFamily:"IBM Plex Mono"}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <RT contentStyle={tip} itemStyle={{color:"#0ea5e9"}} labelStyle={{color:"var(--text-secondary)"}}/>
                  <Area type="monotone" dataKey="scans" stroke="#0ea5e9" strokeWidth={2} fill="url(#sg)" dot={{fill:"#0ea5e9",r:3,strokeWidth:0}}/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-500 font-mono">No activity logged yet</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 glass p-5 flex flex-col" style={{minHeight:220}}>
          <div className={`flex items-center gap-2 mb-3 pb-3 ${div}`}>
            <Filter size={13} style={{color:"#8b5cf6"}}/><span style={{fontFamily:"IBM Plex Mono",fontSize:11,fontWeight:600,letterSpacing:".08em",color:"var(--text-secondary)",textTransform:"uppercase"}}>By Type</span>
          </div>
          {stats.typeData.length>0?(
            <div className="flex-1 flex flex-col">
              <ResponsiveContainer width="100%" height={110}>
                <PieChart><Pie data={stats.typeData} cx="50%" cy="50%" innerRadius={28} outerRadius={48} dataKey="value" strokeWidth={0}>{stats.typeData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Pie><RT contentStyle={tip}/></PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {stats.typeData.map((d,i)=>(
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{background:PIE_COLORS[i%PIE_COLORS.length]}}/><span style={{fontFamily:"IBM Plex Mono",fontSize:10,color:"var(--text-muted)"}}>{d.name}</span></div>
                    <span style={{fontFamily:"IBM Plex Mono",fontSize:10,fontWeight:600,color:"var(--text-secondary)"}}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ):<div className="flex-1 flex items-center justify-center"><p style={{fontFamily:"IBM Plex Mono",fontSize:11,color:"var(--text-faint)",textTransform:"uppercase"}}>No data yet</p></div>}
        </div>
      </motion.div>

      <motion.div variants={fUp} className="glass p-0 overflow-hidden flex flex-col flex-1" style={{minHeight:340}}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-3 ${div}`}>
          <div>
            <div className="flex items-center gap-2 mb-0.5"><Clock size={13} style={{color:"#8b5cf6"}}/><span className="font-semibold text-sm" style={{color:"var(--text-primary)"}}>Intelligence Ledger</span></div>
            <p style={{fontFamily:"IBM Plex Mono",fontSize:10,color:"var(--text-faint)",letterSpacing:".1em",textTransform:"uppercase"}}>{history.length} records · Local query history</p>
          </div>
          {history.length>0&&(
            <motion.button whileTap={{scale:.96}} onClick={handleClear} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl shrink-0 w-full sm:w-auto transition-colors" style={{fontFamily:"IBM Plex Mono",fontSize:10,fontWeight:700,color:"#f43f5e",letterSpacing:".1em",background:"rgba(244,63,94,.08)",border:"1px solid rgba(244,63,94,.2)"}}>
              <Trash2 size={12}/> PURGE RECORDS
            </motion.button>
          )}
        </div>

        {history.length>0?(
          <>
            <div className="md:hidden flex flex-col">
              {history.map(r=>(
                <motion.div key={r.id} whileHover={{backgroundColor:dark?"rgba(56,189,248,.03)":"rgba(3,105,161,.03)"}} className={`flex items-center gap-3 px-5 py-3 transition-colors ${div} cursor-pointer`} onClick={()=>setSel(r)}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${normalizeStatus(r.status)==="EXPOSED"?"bg-rose-500":"bg-emerald-500"}`}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{color:"var(--text-primary)"}}>{hashQuery(r.query,r.type)}</p>
                    <p style={{fontFamily:"IBM Plex Mono",fontSize:10,color:"var(--text-faint)"}}>{fmtDate(r.timestamp)}</p>
                  </div>
                  <button onClick={e=>{e.stopPropagation();setSel(r);}} className="shrink-0 font-bold px-2.5 py-1.5 rounded-lg border" style={{fontFamily:"IBM Plex Mono",fontSize:9,letterSpacing:".08em",color:normalizeStatus(r.status)==="EXPOSED"?"#f43f5e":"#22c55e",border:`1px solid ${normalizeStatus(r.status)==="EXPOSED"?"rgba(244,63,94,.25)":"rgba(34,197,94,.25)"}`,background:normalizeStatus(r.status)==="EXPOSED"?"rgba(244,63,94,.07)":"rgba(34,197,94,.07)"}}>
                    {normalizeStatus(r.status)==="EXPOSED"?"THREAT":"SAFE"}
                  </button>
                </motion.div>
              ))}
            </div>
            
            <div className="hidden md:block overflow-x-auto flex-1" style={{scrollbarWidth:"thin"}}>
              <table className="w-full text-left border-collapse" style={{minWidth:620}}>
                <thead>
                  <tr className="tbl-head sticky top-0 z-10">
                    {["Timestamp","Target","Vector","Breach","Status"].map(h=>(
                      <th key={h} className={`px-5 py-3 border-b ${div.split(" ").slice(1).join(" ")}`} style={{fontFamily:"IBM Plex Mono",fontSize:9,fontWeight:700,color:"var(--text-faint)",letterSpacing:".12em",textTransform:"uppercase"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {history.map((r,i)=>(
                      <motion.tr key={r.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*.03}} className="tbl-row transition-colors cursor-pointer border-b last:border-0" style={{borderColor:"var(--divider)"}} onClick={()=>setSel(r)}>
                        <td className="px-5 py-3"><span style={{fontFamily:"IBM Plex Mono",fontSize:11,color:"var(--text-muted)"}}>{fmtDate(r.timestamp)}</span></td>
                        <td className="px-5 py-3">
                          <span className="text-sm font-medium block truncate max-w-[180px]" style={{color:"var(--text-primary)"}}>{hashQuery(r.query,r.type)}</span>
                          {r.breachName&&r.status==="Exposed"&&<span style={{fontFamily:"IBM Plex Mono",fontSize:10,color:"var(--text-faint)"}} className="block truncate max-w-[180px]">{r.breachName}</span>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg" style={{background:"var(--bg-inset)",border:"1px solid var(--border-subtle)"}}>
                            <TypeIcon type={r.type}/><span style={{fontFamily:"IBM Plex Mono",fontSize:9,fontWeight:700,color:"var(--text-muted)",letterSpacing:".1em"}}>{r.type}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3"><span style={{fontFamily:"IBM Plex Mono",fontSize:11,color:"var(--text-muted)"}} className="block truncate max-w-[160px]">{r.breachName||"—"}</span></td>
                        <td className="px-5 py-3">
                          <button onClick={e=>{e.stopPropagation();setSel(r);}} style={{fontFamily:"IBM Plex Mono",fontSize:9,fontWeight:700,letterSpacing:".08em",padding:"3px 10px",borderRadius:8,color:normalizeStatus(r.status)==="EXPOSED"?"#f43f5e":"#22c55e",border:`1px solid ${normalizeStatus(r.status)==="EXPOSED"?"rgba(244,63,94,.25)":"rgba(34,197,94,.25)"}`,background:normalizeStatus(r.status)==="EXPOSED"?"rgba(244,63,94,.07)":"rgba(34,197,94,.07)"}}>
                            {normalizeStatus(r.status)==="EXPOSED"?"THREAT · VIEW":"CLEARED · VIEW"}
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </>
        ):(
          <div className="flex-1 flex flex-col items-center justify-center py-14" style={{color:"var(--text-faint)"}}>
            <Shield size={32} strokeWidth={1} className="mb-3 opacity-25"/><p style={{fontFamily:"IBM Plex Mono",fontSize:11,letterSpacing:".1em",textTransform:"uppercase",opacity:.4}}>Ledger is Empty</p>
          </div>
        )}
      </motion.div>
    </motion.div>

    <AnimatePresence>
      {sel&&modal&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.22}} className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 modal-overlay" style={{backdropFilter:"blur(16px)"}} onClick={()=>setSel(null)}>
          <motion.div initial={{y:40,opacity:0,scale:.96}} animate={{y:0,opacity:1,scale:1}} exit={{y:20,opacity:0}} transition={{type:"spring",stiffness:340,damping:26}} onClick={e=>e.stopPropagation()} className={`modal-card w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-[2rem] overflow-hidden border ${modalShellClass}`} style={{boxShadow: dark ? "0 30px 100px rgba(0,0,0,.45)" : "0 30px 100px rgba(15,23,42,.22)",fontFamily:"'DM Sans',sans-serif"}}>
            
            <div className="flex-none flex items-center justify-between px-5 py-4" style={{borderBottom: dark ? "1px solid rgba(56,189,248,.14)" : "1px solid rgba(3,105,161,.12)",background: dark ? "rgba(15,23,42,.96)" : "rgba(255,255,255,.96)"}}>
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 blink ${modal.safe?"bg-emerald-500":"bg-rose-500"}`}/>
                <span style={{fontFamily:"IBM Plex Mono",fontSize:11,color:"var(--text-muted)",letterSpacing:".1em",textTransform:"uppercase"}} className="shrink-0 hidden sm:block">Record —</span>
                <span style={{fontFamily:"IBM Plex Mono",fontSize:14,fontWeight:600,color:"var(--text-primary)"}} className="truncate">{hashQuery(sel.query,sel.type)}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className={`hidden sm:inline font-bold px-3 py-1 rounded-full border tracking-wider ${modal.safe?"text-emerald-500 border-emerald-500/30 bg-emerald-500/10":"text-rose-500 border-rose-500/30 bg-rose-500/10"}`} style={{fontFamily:"IBM Plex Mono",fontSize:10}}>{modal.safe?"✓ CLEAN":"⚠ BREACH DETECTED"}</span>
                <motion.button onClick={()=>setSel(null)} whileHover={{scale:1.1}} whileTap={{scale:.9}} className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:"var(--bg-inset)",border:"1px solid var(--border)",color:"var(--text-muted)"}}><X size={14}/></motion.button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6" style={{scrollbarWidth:"thin"}}>
              {modalPreparing ? (
                <div className={`flex min-h-[280px] items-center justify-center rounded-2xl border ${modalPanelClass}`}>
                  <div className="flex items-center gap-3" style={{fontFamily:"IBM Plex Mono",fontSize:12,color:"var(--text-muted)"}}>
                    <Loader2 size={15} className="animate-spin" />
                    Loading full result details...
                  </div>
                </div>
              ) : (
                <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className={`rounded-2xl border p-5 flex flex-col items-center ${modalPanelClass}`}>
                  <p style={{fontFamily:"IBM Plex Mono",fontSize:10,color:"var(--text-muted)",letterSpacing:".12em",textTransform:"uppercase"}} className="mb-4">Risk Score</p>
                  <div className="relative w-32 h-[68px]">
                    <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full overflow-visible">
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={dark ? "rgba(148,163,184,.22)" : "var(--border)"} strokeWidth="6" strokeLinecap="round"/>
                      <motion.path initial={{strokeDashoffset:125.6}} animate={{strokeDashoffset:125.6-(modal.score/100)*125.6}} transition={{duration:1.4,ease:"easeOut",delay:.3}} d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={modal.gc} strokeWidth="6" strokeLinecap="round" strokeDasharray={125.6} style={{filter:`drop-shadow(0 0 8px ${modal.gc})`}}/>
                    </svg>
                    <motion.div className="absolute bottom-0 rounded-t-full origin-bottom" style={{left:"calc(50% - 2.5px)",width:"5px",height:"44px",background:modal.gc}} initial={{rotate:-90}} animate={{rotate:-90+(modal.score/100)*180}} transition={{duration:1.4,ease:"easeOut",delay:.3}}/>
                  </div>
                  <p style={{fontFamily:"IBM Plex Mono",fontSize:20,fontWeight:700,color:modal.rc}} className="mt-4">{modal.level}</p>
                </div>
                <div className={`rounded-2xl border p-5 shadow-sm ${modalPanelClass}`}>
                  <p style={{fontFamily:"IBM Plex Mono",fontSize:10,color:"var(--text-muted)",letterSpacing:".12em",textTransform:"uppercase"}} className="mb-4">Scan Details</p>
                  <ul className="space-y-3">
                    {[{icon:Filter,l:"Type",v:sel.type},{icon:Globe,l:"Source",v:modal.source,c:true},{icon:AlertTriangle,l:"Breach",v:modal.breach,c:true},{icon:Calendar,l:"Date",v:modal.scanDate}].map(({icon:Icon,l,v,c})=>(
                      <li key={l} className="flex items-center gap-2.5 text-xs"><Icon size={12} style={{color:dark?"#94a3b8":"var(--text-faint)",flexShrink:0}}/><span className="w-16 shrink-0" style={{color:"var(--text-muted)"}}>{l}</span><span style={{fontFamily:"IBM Plex Mono",fontWeight:500,color:c?(modal.safe?"#22c55e":"#f43f5e"):(dark?"#cbd5e1":"var(--text-secondary)")}} className="truncate">{v}</span></li>
                    ))}
                  </ul>
                </div>
                <div className={`rounded-2xl border p-5 flex flex-col shadow-sm ${modalPanelClass}`}>
                  <p style={{fontFamily:"IBM Plex Mono",fontSize:10,color:"var(--text-muted)",letterSpacing:".12em",textTransform:"uppercase"}} className="mb-4">Exposed Fields</p>
                  <div className="space-y-2 overflow-y-auto flex-1" style={{scrollbarWidth:"thin"}}>
                    {modal.list.map((item,i)=>(
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium" style={{background:modal.safe?(dark?"rgba(34,197,94,.12)":"rgba(34,197,94,.06)"):(dark?"rgba(244,63,94,.12)":"rgba(244,63,94,.06)"),border:`1px solid ${modal.safe?(dark?"rgba(34,197,94,.28)":"rgba(34,197,94,.15)"):(dark?"rgba(244,63,94,.28)":"rgba(244,63,94,.15)" )}`,color:dark?"#e2e8f0":"var(--text-secondary)"}}><LayoutTemplate size={11} style={{color:modal.safe?"#22c55e":"#f43f5e",flexShrink:0}}/>{item}</div>
                    ))}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {sel.type === "IP" && (
                  <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:"auto"}} exit={{opacity:0, height:0}} className="overflow-hidden">
                      <div className={`rounded-2xl p-5 mb-4 border ${modalPanelClass}`}>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <Server size={14} style={{color:"var(--accent)"}}/>
                          <h3 style={{fontFamily:"IBM Plex Mono",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--text-primary)"}}>Advanced Threat Intel</h3>
                        </div>
                        {enrichedData && <span style={{fontFamily:"IBM Plex Mono", fontSize:9, color:"var(--text-faint)"}}>{enrichedData.source}</span>}
                      </div>
                      
                      {isEnriching ? (
                        <div className="flex items-center gap-3 py-3" style={{color:"var(--text-muted)", fontFamily:"IBM Plex Mono", fontSize:11}}>
                          <Loader2 size={14} className="animate-spin" /> Retrieving cached IP logs...
                        </div>
                      ) : enrichedData ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                           <div className={`rounded-xl border p-3 ${dark?"border-slate-700 bg-slate-950/70":"border-slate-200 bg-white"}`}><p className={`text-[10px] uppercase ${modalSubtleClass}`}>ISP Provider</p><p className="font-mono text-xs mt-1 truncate font-semibold text-sky-500">{enrichedData.isp || "Unknown"}</p></div>
                           <div className={`rounded-xl border p-3 ${dark?"border-slate-700 bg-slate-950/70":"border-slate-200 bg-white"}`}><p className={`text-[10px] uppercase ${modalSubtleClass}`}>Malicious</p><p className="font-mono text-xs mt-1 text-rose-400 font-bold">{enrichedData.vtStats?.malicious || 0} engines</p></div>
                           <div className={`rounded-xl border p-3 ${dark?"border-slate-700 bg-slate-950/70":"border-slate-200 bg-white"}`}><p className={`text-[10px] uppercase ${modalSubtleClass}`}>Suspicious</p><p className="font-mono text-xs mt-1 text-amber-400 font-bold">{enrichedData.vtStats?.suspicious || 0} engines</p></div>
                           <div className={`rounded-xl border p-3 ${dark?"border-slate-700 bg-slate-950/70":"border-slate-200 bg-white"}`}><p className={`text-[10px] uppercase ${modalSubtleClass}`}>Harmless</p><p className="font-mono text-xs mt-1 text-emerald-400 font-bold">{enrichedData.vtStats?.harmless || 0} engines</p></div>
                        </div>
                      ) : (
                        <div className="py-2 text-xs text-rose-400 font-mono">Failed to load enrichment data.</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={`rounded-2xl p-5 border ${modalPanelClass}`}>
                <div className="flex items-center gap-2 mb-4"><Lock size={13} style={{color:modal.safe?"#22c55e":"#f43f5e"}}/><h3 style={{fontFamily:"IBM Plex Mono",fontSize:11,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:modal.safe?"#22c55e":"#f43f5e"}}>Recommended Countermeasures</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PREVENTION[sel.type]?.map((a,i)=>(
                    <div key={i} className="flex items-start gap-2.5 text-sm" style={{color:dark?"#cbd5e1":"var(--text-secondary)"}}><CheckCircle size={13} style={{color:modal.safe?"#22c55e":"#f43f5e",flexShrink:0,marginTop:2}}/>{a}</div>
                  ))}
                </div>
              </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
