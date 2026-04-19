import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Shield, AlertTriangle, Globe, Lock, Database,
  TrendingUp, Users, Eye, Radio, Activity, MapPin, FileText,
  Bell, ChevronRight, Zap, Server, Clock, Filter, Search,
  BarChart2, Terminal, Crosshair, Flag
} from "lucide-react";
import { useTheme } from "../ThemeContext";
import { getSession } from "../userStorage";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie
} from "recharts";

/* ─── Dummy government data ─── */
const NATION_STATS = [
  { label:"Active Threats",    value:"4,821",  delta:"+127 today",  color:"#f43f5e", icon:AlertTriangle  },
  { label:"IPs Blacklisted",   value:"2.3M+",  delta:"+8,440 24h",  color:"#f97316", icon:Globe          },
  { label:"Agencies Online",   value:"38",     delta:"of 40 total", color:"#22c55e", icon:Building2      },
  { label:"Critical Assets",   value:"12,988", delta:"under monitoring", color:"#0891b2", icon:Shield    },
  { label:"Incidents Today",   value:"247",    delta:"+34 vs yesterday", color:"#a78bfa", icon:Activity   },
  { label:"Classified Intel",  value:"1,204",  delta:"reports indexed",  color:"#eab308",  icon:FileText  },
];

const ACTIVE_INCIDENTS = [
  { id:"INC-2025-4821", name:"APT41 Infrastructure Detected",       sev:"CRITICAL", target:"Govt. Finance Portal",  state:"Active",  agency:"CERT-In",    time:"03:12 ago" },
  { id:"INC-2025-4820", name:"UIDAI Database Probing Attempt",      sev:"CRITICAL", target:"UIDAI Servers, Delhi",   state:"Active",  agency:"NCIIPC",     time:"1h 4m ago" },
  { id:"INC-2025-4819", name:"DDoS on NIC Infrastructure",          sev:"HIGH",     target:"NIC Backbone Nodes",     state:"Mitigating",agency:"NIC-CERT", time:"2h ago"    },
  { id:"INC-2025-4818", name:"Ransomware in State Health Dept.",     sev:"HIGH",     target:"Maharashtra Health Sys", state:"Contained",agency:"MH-CERT",   time:"4h ago"    },
  { id:"INC-2025-4817", name:"BGP Hijack — Reliance JIO AS",        sev:"MEDIUM",   target:"AS55836",                state:"Resolved", agency:"CERT-In",   time:"6h ago"    },
  { id:"INC-2025-4816", name:"Phishing Campaign — Railway Booking",  sev:"MEDIUM",   target:"IRCTC Users (~2.4M)",    state:"Active",  agency:"IRCTC-CERT", time:"8h ago"    },
];

const THREAT_ACTORS = [
  { name:"APT41 (Winnti)",    origin:"China",  type:"Nation-State", activity:"HIGH",     targets:"Finance,Defense", tracked:"18 months" },
  { name:"Lazarus Group",     origin:"N.Korea", type:"Nation-State", activity:"HIGH",     targets:"Crypto,Banking",  tracked:"24 months" },
  { name:"Transparent Tribe", origin:"Pakistan",type:"Nation-State", activity:"CRITICAL", targets:"Govt,Military",   tracked:"36 months" },
  { name:"SideWinder",        origin:"Unknown", type:"APT",          activity:"MEDIUM",   targets:"Maritime,Govt",   tracked:"12 months" },
  { name:"LockBit Affiliates",origin:"RU/CN",   type:"Ransomware",   activity:"HIGH",     targets:"Healthcare,Edu",  tracked:"8 months"  },
];

const STATE_ALERTS = [
  { state:"Maharashtra", alerts:124, color:"#f43f5e" },
  { state:"Delhi",       alerts:98,  color:"#f97316" },
  { state:"Karnataka",   alerts:76,  color:"#eab308" },
  { state:"Tamil Nadu",  alerts:61,  color:"#22c55e" },
  { state:"Gujarat",     alerts:54,  color:"#0891b2" },
  { state:"Telangana",   alerts:48,  color:"#a78bfa" },
  { state:"Punjab",      alerts:31,  color:"#f472b6" },
];

const TIMELINE = [
  {t:"00:00",h:12},{t:"03:00",h:8},{t:"06:00",h:15},{t:"09:00",h:34},
  {t:"12:00",h:51},{t:"15:00",h:47},{t:"18:00",h:62},{t:"21:00",h:44},{t:"Now",h:38},
];

const SECTOR_RISKS = [
  {sector:"Finance",    risk:87, color:"#f43f5e"},{sector:"Defence",  risk:73, color:"#f97316"},
  {sector:"Health",     risk:61, color:"#eab308"},{sector:"Power Grid",risk:79, color:"#a78bfa"},
  {sector:"Telecom",    risk:55, color:"#38bdf8"},{sector:"Transport", risk:48, color:"#22c55e"},
];

const SEV_COLOR = {
  CRITICAL:   { badge:"bg-rose-500/12 text-rose-400 border border-rose-500/30",     dot:"bg-rose-500"    },
  HIGH:       { badge:"bg-orange-500/12 text-orange-400 border border-orange-500/30",dot:"bg-orange-500"  },
  MEDIUM:     { badge:"bg-amber-500/12 text-amber-400 border border-amber-500/30",   dot:"bg-amber-500"   },
};
const STATE_COLOR = {
  Active:     "text-rose-400",
  Mitigating: "text-amber-400",
  Contained:  "text-sky-400",
  Resolved:   "text-emerald-400",
};

export default function GovDashboard() {
  const { dark }  = useTheme();
  const user      = getSession();
  const [tab,     setTab]     = useState("overview"); // overview | incidents | actors | reports
  const [time,    setTime]    = useState(new Date());

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const axisColor  = dark ? "#2a4a63" : "#6a9aba";
  const tipStyle   = { background: dark?"#060d1f":"#fff", border:"1px solid var(--border-glow)", borderRadius:10, fontFamily:"IBM Plex Mono", fontSize:11 };
  const divider    = dark ? "border-slate-800/40" : "border-blue-100";
  const heading    = dark ? "text-[#e8f4fd]" : "text-[#0c1f3a]";

  const TABS = [
    { id:"overview",  label:"Overview",       icon:BarChart2   },
    { id:"incidents", label:"Live Incidents",  icon:AlertTriangle },
    { id:"actors",    label:"Threat Actors",  icon:Crosshair   },
    { id:"reports",   label:"Intel Reports",  icon:FileText    },
  ];

  const stagger = { hidden:{opacity:0}, visible:{opacity:1,transition:{staggerChildren:.06}} };
  const fUp = { hidden:{opacity:0,y:14}, visible:{opacity:1,y:0,transition:{type:"spring",stiffness:300,damping:24}} };

  return (
    <div className="flex-1 w-full flex flex-col" style={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── TOP CLASSIFICATION BANNER ── */}
      <div className="flex items-center justify-center gap-3 py-2 px-4 border-b border-white/10"
        style={{ background:"linear-gradient(90deg,#07263b,#0b4c66,#07263b)", backgroundSize:"200% 100%", animation:"shimmer 3s linear infinite" }}>
        <Lock size={12} className="text-cyan-100"/>
        <span className="text-white font-black tracking-[0.3em] uppercase text-[10px]" style={{fontFamily:"IBM Plex Mono"}}>
          TOP SECRET — GOVERNMENT OF INDIA · CERT-IN CLASSIFIED NETWORK
        </span>
        <Lock size={12} className="text-cyan-100"/>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="visible"
        className="flex-1 px-4 sm:px-6 md:px-10 py-5 overflow-y-auto" style={{scrollbarWidth:"thin"}}>

        {/* ── Header ── */}
        <motion.div variants={fUp} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b ${divider}`}>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,.12)]">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center gov-badge gov-glow">
                <Building2 size={20} style={{color:"var(--gov-color)"}}/>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${heading}`}>
                  <span className="bg-[linear-gradient(to_right,#ff8a00,#e5b061,#72aeb6,#0ea5e9)] bg-clip-text text-transparent">Cyber Attack Visualizer</span>{" "}
                  <span style={{background:"linear-gradient(90deg,#0891b2,#22d3ee)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                    Government Dashboard
                  </span>
                </h1>
                <p style={{color:"var(--text-muted)",fontSize:13}}>Real-time national cyber-threat intelligence · {user?.department}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass-inset px-3 py-2 text-center border border-white/10">
              <div style={{fontFamily:"IBM Plex Mono",fontSize:18,fontWeight:700,color:"var(--gov-color)",letterSpacing:".05em",lineHeight:1}}>
                {time.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
              </div>
              <div style={{fontFamily:"IBM Plex Mono",fontSize:9,color:"var(--text-faint)",letterSpacing:".1em",marginTop:2}}>
                {time.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})} IST
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 blink relative pulse-ring" style={{color:"#22c55e"}}/>
                <span style={{fontFamily:"IBM Plex Mono",fontSize:10,color:"#22c55e"}}>SYSTEMS NOMINAL</span>
              </div>
              <span style={{fontFamily:"IBM Plex Mono",fontSize:9,color:"var(--text-faint)"}}>Clearance: {user?.clearance||"TOP SECRET"}</span>
            </div>
          </div>
        </motion.div>

        {/* ── Nation stats ── */}
        <motion.div variants={fUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          {NATION_STATS.map(s=>{
            const Icon = s.icon;
            return (
              <motion.div key={s.label} whileHover={{y:-2,scale:1.02}} className="glass p-4 flex flex-col gap-2 border border-white/10">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{background:`${s.color}14`,border:`1px solid ${s.color}28`}}>
                  <Icon size={15} style={{color:s.color}}/>
                </div>
                <div className={`font-bold text-xl stat-val`} style={{fontFamily:"IBM Plex Mono"}}>{s.value}</div>
                <div style={{fontSize:10,color:"var(--text-muted)"}}>{s.label}</div>
                <div style={{fontSize:9,fontFamily:"IBM Plex Mono",color:s.color}}>{s.delta}</div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Tab nav ── */}
        <motion.div variants={fUp} className="flex gap-1 mb-5 p-1 rounded-xl" style={{background:"var(--bg-inset)",width:"fit-content"}}>
          {TABS.map(t=>{
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <motion.button key={t.id} onClick={()=>setTab(t.id)} whileHover={{scale:1.03}} whileTap={{scale:.97}}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all"
                style={{
                  background: on ? "var(--gov-soft)" : "transparent",
                  color: on ? "var(--gov-color)" : "var(--text-muted)",
                  border: on ? "1px solid rgba(34,211,238,.28)" : "1px solid transparent",
                }}>
                <Icon size={13}/>{t.label}
              </motion.button>
            );
          })}
        </motion.div>

    
        <AnimatePresence mode="wait">

         
          {tab === "overview" && (
            <motion.div key="overview" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.25}}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">

                {/* Hourly incident timeline */}
                <div className="lg:col-span-7 glass p-5 flex flex-col border border-white/10" style={{minHeight:220}}>
                  <div className={`flex items-center justify-between mb-4 pb-3 border-b ${divider}`}>
                    <div className="flex items-center gap-2">
                      <Activity size={14} style={{color:"var(--gov-color)"}}/>
                      <span style={{fontFamily:"IBM Plex Mono",fontSize:11,fontWeight:600,color:"var(--text-secondary)",letterSpacing:".08em"}}>HOURLY INCIDENT VOLUME — TODAY</span>
                    </div>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 blink"/>
                      <span style={{fontFamily:"IBM Plex Mono",fontSize:9,color:"var(--text-faint)"}}>LIVE</span>
                    </span>
                  </div>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={TIMELINE} margin={{top:4,right:4,left:-28,bottom:0}}>
                        <defs>
                          <linearGradient id="govGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0891b2" stopOpacity={dark?.28:.18}/>
                            <stop offset="100%" stopColor="#0891b2" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={dark?"rgba(56,189,248,.05)":"rgba(3,105,161,.07)"} />
                        <XAxis dataKey="t" tick={{fill:axisColor,fontSize:10,fontFamily:"IBM Plex Mono"}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fill:axisColor,fontSize:10,fontFamily:"IBM Plex Mono"}} axisLine={false} tickLine={false}/>
                        <Tooltip contentStyle={tipStyle} labelStyle={{color:"var(--text-secondary)"}} itemStyle={{color:"#0891b2"}}/>
                        <Area type="monotone" dataKey="h" name="Incidents" stroke="#0891b2" strokeWidth={2.5} fill="url(#govGrad)" dot={{fill:"#0891b2",r:3,strokeWidth:0}}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* State alerts */}
                <div className="lg:col-span-5 glass p-5 flex flex-col border border-white/10">
                  <div className={`flex items-center justify-between mb-4 pb-3 border-b ${divider}`}>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-rose-400"/>
                      <span style={{fontFamily:"IBM Plex Mono",fontSize:11,fontWeight:600,color:"var(--text-secondary)",letterSpacing:".08em"}}>ALERTS BY STATE</span>
                    </div>
                  </div>
                  <div className="flex-1" style={{minHeight:160}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={STATE_ALERTS} layout="vertical" margin={{top:0,right:8,left:8,bottom:0}}>
                        <XAxis type="number" tick={{fill:axisColor,fontSize:9,fontFamily:"IBM Plex Mono"}} axisLine={false} tickLine={false}/>
                        <YAxis type="category" dataKey="state" tick={{fill:"var(--text-secondary)",fontSize:10,fontFamily:"IBM Plex Mono"}} axisLine={false} tickLine={false} width={70}/>
                        <Tooltip contentStyle={tipStyle}/>
                        <Bar dataKey="alerts" radius={[0,4,4,0]}>
                          {STATE_ALERTS.map((e,i)=><Cell key={i} fill={e.color}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Sector risk + recent incidents */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Sector risk */}
                <div className="glass p-5 border border-white/10">
                  <div className={`flex items-center gap-2 mb-4 pb-3 border-b ${divider}`}>
                    <Shield size={14} style={{color:"var(--gov-color)"}}/>
                    <span style={{fontFamily:"IBM Plex Mono",fontSize:11,fontWeight:600,color:"var(--text-secondary)",letterSpacing:".08em"}}>CRITICAL SECTOR RISK INDEX</span>
                  </div>
                  <div className="space-y-3">
                    {SECTOR_RISKS.map(s=>(
                      <div key={s.sector}>
                        <div className="flex justify-between mb-1">
                          <span style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>{s.sector}</span>
                          <span style={{fontFamily:"IBM Plex Mono",fontSize:12,fontWeight:700,color:s.color}}>{s.risk}/100</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{background:"var(--border)"}}>
                          <motion.div className="h-full rounded-full"
                            initial={{width:0}} animate={{width:`${s.risk}%`}} transition={{duration:.8,ease:"easeOut",delay:.1}}
                            style={{background:s.color,boxShadow:`0 0 8px ${s.color}80`}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top active incidents preview */}
                <div className="glass p-0 overflow-hidden border border-white/10">
                  <div className={`flex items-center justify-between px-5 py-3.5 border-b ${divider}`}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-rose-400"/>
                      <span style={{fontFamily:"IBM Plex Mono",fontSize:11,fontWeight:600,color:"var(--text-secondary)",letterSpacing:".08em"}}>TOP ACTIVE INCIDENTS</span>
                    </div>
                    <button onClick={()=>setTab("incidents")}
                      className="flex items-center gap-1 text-[10px] transition-colors"
                      style={{fontFamily:"IBM Plex Mono",color:"var(--gov-color)",background:"none",border:"none",cursor:"pointer"}}>
                      View all <ChevronRight size={11}/>
                    </button>
                  </div>
                  <div className="divide-y" style={{borderColor:"var(--divider)"}}>
                    {ACTIVE_INCIDENTS.slice(0,4).map(inc=>{
                      const s = SEV_COLOR[inc.sev];
                      return (
                        <div key={inc.id} className="flex items-center gap-3 px-5 py-3 row-hover transition-colors">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`}/>
                          <div className="flex-1 min-w-0">
                            <p style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}} className="truncate">{inc.name}</p>
                            <p style={{fontFamily:"IBM Plex Mono",fontSize:10,color:"var(--text-muted)"}}>{inc.target}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`mono text-[9px] font-bold px-2 py-0.5 rounded ${s.badge}`} style={{fontFamily:"IBM Plex Mono"}}>{inc.sev}</span>
                            <span style={{fontFamily:"IBM Plex Mono",fontSize:9,color:"var(--text-faint)"}}>{inc.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── LIVE INCIDENTS ── */}
          {tab === "incidents" && (
            <motion.div key="incidents" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.25}}>
              <div className="glass overflow-hidden p-0 border border-white/10">
                <div className={`px-5 py-4 border-b ${divider} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-rose-400"/>
                    <span style={{fontFamily:"IBM Plex Mono",fontSize:12,fontWeight:700,color:"var(--text-primary)",letterSpacing:".08em"}}>NATIONAL INCIDENT REGISTRY</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                      style={{fontFamily:"IBM Plex Mono",background:"rgba(244,63,94,.1)",color:"#f43f5e",border:"1px solid rgba(244,63,94,.25)"}}>
                      {ACTIVE_INCIDENTS.length} ACTIVE
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 blink"/>
                    <span style={{fontFamily:"IBM Plex Mono",fontSize:9,color:"var(--text-faint)"}}>LIVE</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse" style={{minWidth:700}}>
                    <thead>
                      <tr className="tbl-head">
                        {["Incident ID","Name","Severity","Target","Status","Agency","Reported"].map(h=>(
                          <th key={h} className={`px-5 py-3 text-left border-b ${divider}`}
                            style={{fontFamily:"IBM Plex Mono",fontSize:9,fontWeight:700,color:"var(--text-faint)",letterSpacing:".12em",textTransform:"uppercase"}}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ACTIVE_INCIDENTS.map((inc,i)=>{
                        const sc = SEV_COLOR[inc.sev];
                        return (
                          <motion.tr key={inc.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*.04}}
                            className={`tbl-row border-b last:border-0 cursor-pointer`} style={{borderColor:"var(--divider)"}}>
                            <td className="px-5 py-3.5">
                              <span style={{fontFamily:"IBM Plex Mono",fontSize:11,color:"var(--gov-color)"}}>{inc.id}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>{inc.name}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${sc.badge}`} style={{fontFamily:"IBM Plex Mono"}}>{inc.sev}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span style={{fontSize:12,color:"var(--text-secondary)"}}>{inc.target}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`text-xs font-semibold ${STATE_COLOR[inc.state]||"text-slate-400"}`}>{inc.state}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span style={{fontFamily:"IBM Plex Mono",fontSize:11,color:"var(--text-muted)"}}>{inc.agency}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span style={{fontFamily:"IBM Plex Mono",fontSize:10,color:"var(--text-faint)"}}>{inc.time}</span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

      
          {tab === "actors" && (
            <motion.div key="actors" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.25}}>
              <div className="glass overflow-hidden p-0">
                <div className={`px-5 py-4 border-b ${divider}`}>
                  <div className="flex items-center gap-2">
                    <Crosshair size={15} style={{color:"var(--gov-color)"}}/>
                    <span style={{fontFamily:"IBM Plex Mono",fontSize:12,fontWeight:700,color:"var(--text-primary)",letterSpacing:".08em"}}>TRACKED THREAT ACTOR PROFILES</span>
                  </div>
                  <p style={{fontSize:12,color:"var(--text-muted)",marginTop:4}}>CLASSIFIED · For authorised personnel only</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                  {THREAT_ACTORS.map((a,i)=>(
                    <motion.div key={a.name} initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} transition={{delay:i*.06}}
                      whileHover={{y:-3}} className="glass-inset p-4 cursor-pointer border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{background:a.activity==="CRITICAL"?"rgba(244,63,94,.12)":a.activity==="HIGH"?"rgba(249,115,22,.12)":"rgba(234,179,8,.12)"}}>
                            <Crosshair size={14} style={{color:a.activity==="CRITICAL"?"#f43f5e":a.activity==="HIGH"?"#f97316":"#eab308"}}/>
                          </div>
                          <div>
                            <p style={{fontWeight:700,fontSize:13,color:"var(--text-primary)"}}>{a.name}</p>
                            <p style={{fontFamily:"IBM Plex Mono",fontSize:9,color:"var(--text-faint)"}}>{a.origin}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${SEV_COLOR[a.activity]?.badge||"text-slate-400 border-slate-700"}`}
                          style={{fontFamily:"IBM Plex Mono"}}>{a.activity}</span>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          {label:"Type",    val:a.type},
                          {label:"Targets", val:a.targets},
                          {label:"Tracked", val:a.tracked},
                        ].map(({label,val})=>(
                          <div key={label} className="flex justify-between">
                            <span style={{fontSize:11,color:"var(--text-muted)"}}>{label}</span>
                            <span style={{fontSize:11,fontWeight:600,color:"var(--text-primary)"}}>{val}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── INTEL REPORTS ── */}
          {tab === "reports" && (
            <motion.div key="reports" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.25}}>
              <div className="glass p-0 overflow-hidden border border-white/10">
                <div className={`px-5 py-4 border-b ${divider}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={15} style={{color:"var(--gov-color)"}}/>
                    <span style={{fontFamily:"IBM Plex Mono",fontSize:12,fontWeight:700,color:"var(--text-primary)",letterSpacing:".08em"}}>CLASSIFIED INTELLIGENCE REPORTS</span>
                  </div>
                  <p style={{fontSize:12,color:"var(--text-muted)"}}>Most recent threat assessments and advisories</p>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {title:"APT41 Campaign Analysis — Q1 2025",      classification:"TOP SECRET",  date:"22 Mar 2025", pages:47, agency:"CERT-In"},
                    {title:"Critical Infrastructure Vulnerability Report",classification:"SECRET", date:"21 Mar 2025", pages:23, agency:"NCIIPC"},
                    {title:"UPI Fraud Ecosystem — Deep Dive",         classification:"CONFIDENTIAL",date:"20 Mar 2025", pages:31, agency:"RBI-CISO"},
                    {title:"National Cyber Threat Landscape 2025",     classification:"SECRET",    date:"18 Mar 2025", pages:88, agency:"NSA-IN"},
                    {title:"AI-Assisted Phishing Surge — Advisory",   classification:"RESTRICTED", date:"15 Mar 2025", pages:12, agency:"CERT-In"},
                    {title:"Border Region Network Intrusion Report",   classification:"TOP SECRET", date:"14 Mar 2025", pages:56, agency:"DRDO-CERT"},
                  ].map((r,i)=>{
                    const classColor = r.classification==="TOP SECRET"?"#f43f5e":r.classification==="SECRET"?"#f97316":r.classification==="CONFIDENTIAL"?"#eab308":"#22c55e";
                    return (
                      <motion.div key={r.title} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.05}}
                        whileHover={{y:-2}} className="glass-inset p-4 cursor-pointer transition-all border border-white/10">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{background:`${classColor}12`,border:`1px solid ${classColor}28`}}>
                            <FileText size={15} style={{color:classColor}}/>
                          </div>
                          <span style={{fontFamily:"IBM Plex Mono",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:6,
                            color:classColor,border:`1px solid ${classColor}30`,background:`${classColor}0e`}}>
                            {r.classification}
                          </span>
                        </div>
                        <h3 style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginBottom:8,lineHeight:1.4}}>{r.title}</h3>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span style={{fontFamily:"IBM Plex Mono",fontSize:10,color:"var(--text-muted)"}}>{r.date}</span>
                            <span style={{fontFamily:"IBM Plex Mono",fontSize:10,color:"var(--text-faint)"}}>{r.pages}pp</span>
                          </div>
                          <span style={{fontFamily:"IBM Plex Mono",fontSize:10,fontWeight:600,color:"var(--gov-color)"}}>{r.agency}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
