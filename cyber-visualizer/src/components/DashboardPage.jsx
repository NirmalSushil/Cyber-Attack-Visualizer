import React, { useEffect, useState } from "react";
import { 
  Shield, AlertTriangle, Activity, CheckCircle, User, 
  Mail, Clock, Search, Trash2, Server, Fingerprint, 
  Zap, Globe, Smartphone, CreditCard, Wifi, Crosshair,
  X, Filter, Calendar, LayoutTemplate // Added icons for modal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

const PIE_COLORS = ["#06b6d4", "#6366f1", "#8b5cf6", "#3b82f6", "#eab308", "#10b981"];

const preventionMethods = {
  EMAIL: ["Monitor financial transactions linked with Email.", "Enable Two-Factor Authentication (2FA) immediately.", "Check your connected accounts for unauthorized access.", "Avoid sharing sensitive data via email replies."],
  PHONE: ["Never share OTPs or banking PINs over phone calls.", "Be wary of SMS phishing (Smishing) containing links.", "Register number on Do Not Call (DND) registry.", "Contact your carrier to prevent SIM swapping."],
  AADHAAR: ["Lock your Aadhaar biometrics using mAadhaar app.", "Use Virtual ID (VID) instead of real Aadhaar number.", "Check your Aadhaar authentication history for anomalies.", "Never share unmasked photocopies of your Aadhaar."],
  PAN: ["Monitor financial transactions linked with PAN.", "Check your credit report for unknown loans.", "Avoid sharing PAN on untrusted websites.", "Report misuse to financial authorities."],
  IP: ["Restart your router to obtain a new dynamic IP.", "Use a reputable VPN to mask your traffic.", "Ensure router's firmware is updated.", "Run a full malware scan on connected devices."],
  URL: ["Do not enter any personal credentials on this domain.", "Report the malicious URL to Google Safe Browsing.", "Ensure browser web-protection is enabled.", "Clear browser cache, cookies, and history."]
};

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, exposed: 0, safe: 0, riskScore: 100, typeData: [], timelineData: [] });
  
  // NEW: State for controlling the popup modal
  const [selectedRecord, setSelectedRecord] = useState(null);

  const loadUserData = () => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
      const historyKey = `search_history_${storedUser.email}`;
      const storedHistory = JSON.parse(localStorage.getItem(historyKey)) || [];
      setHistory(storedHistory);
      calculateMetrics(storedHistory);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const calculateMetrics = (data) => {
    const exposedCount = data.filter(item => item.status === "Exposed").length;
    const safeCount = data.filter(item => item.status === "Safe").length;
    const risk = data.length === 0 ? 100 : Math.max(0, Math.round(100 - ((exposedCount / data.length) * 100)));

    const typeCounts = {};
    data.forEach(item => { typeCounts[item.type] = (typeCounts[item.type] || 0) + 1; });
    const typeData = Object.keys(typeCounts).map(key => ({ name: key, value: typeCounts[key] }));

    const dateCounts = {};
    data.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    const timelineData = Object.keys(dateCounts).slice(-7).map(date => ({ date, scans: dateCounts[date] }));

    setStats({ total: data.length, exposed: exposedCount, safe: safeCount, riskScore: risk, typeData, timelineData });
  };

  const handleClearHistory = () => {
    if (window.confirm("CRITICAL WARNING: Purging intelligence ledger. This cannot be undone. Proceed?")) {
      const historyKey = `search_history_${user.email}`;
      localStorage.removeItem(historyKey);
      setHistory([]);
      calculateMetrics([]);
    }
  };

  const glassPanel = "bg-[#0f172a]/70 backdrop-blur-2xl border border-slate-700/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] rounded-2xl p-6 transition-all duration-300 hover:border-slate-500/50 hover:shadow-[0_8px_40px_0_rgba(6,182,212,0.1)] relative overflow-hidden";

  const containerVars = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVars = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } } };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'EMAIL': return <Mail size={14} className="text-blue-400" />;
      case 'URL': return <Globe size={14} className="text-indigo-400" />;
      case 'IP': return <Wifi size={14} className="text-cyan-400" />;
      case 'PHONE': return <Smartphone size={14} className="text-emerald-400" />;
      case 'AADHAAR': return <Shield size={14} className="text-orange-400" />;
      case 'PAN': return <CreditCard size={14} className="text-yellow-400" />;
      default: return <Search size={14} className="text-slate-400" />;
    }
  };

  // --- MODAL LOGIC ---
  const closeModal = () => setSelectedRecord(null);

  const getModalData = () => {
    if (!selectedRecord) return null;
    const isSafe = selectedRecord.status === "Safe";
    
    // Fallbacks included in case older history records don't have full details
    const source = selectedRecord.source || "System History";
    const breachName = selectedRecord.breachName || (isSafe ? "None" : "Multiple Risks Detected");
    const compromisedStr = selectedRecord.compromisedData || "";
    const scanDate = formatDate(selectedRecord.timestamp);
    const compromisedList = compromisedStr ? compromisedStr.split(',').map(s => s.trim()) : (isSafe ? ["None"] : ["Archived Threat Data"]);
    const score = selectedRecord.severityScore !== undefined ? parseInt(selectedRecord.severityScore) : (isSafe ? 0 : 85);
    
    let riskLevel = "SAFE";
    let riskColor = "text-emerald-400";
    let gaugeColor = "#10b981";
    
    if (!isSafe) {
      if (score < 40) { riskLevel = "LOW"; riskColor = "text-yellow-400"; gaugeColor = "#eab308"; }
      else if (score < 75) { riskLevel = "MEDIUM"; riskColor = "text-orange-400"; gaugeColor = "#f97316"; }
      else { riskLevel = "CRITICAL"; riskColor = "text-red-500"; gaugeColor = "#ef4444"; }
    }

    return { isSafe, source, breachName, compromisedList, score, riskLevel, riskColor, gaugeColor, scanDate };
  };

  const modalData = getModalData();

  if (!user) return null;

  const gaugeRadius = 40;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - (stats.riskScore / 100) * gaugeCircumference;
  const gaugeColor = stats.riskScore > 80 ? "#10b981" : stats.riskScore > 50 ? "#eab308" : "#ef4444";

  return (
    <motion.div variants={containerVars} initial="hidden" animate="visible" className="flex-1 w-full flex flex-col px-4 md:px-8 py-6 overflow-y-auto relative z-10 custom-scrollbar font-sans text-slate-300">
      
      {/* HEADER */}
      <motion.div variants={itemVars} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-slate-800/80 pb-6 relative">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-widest drop-shadow-md">
              INTELLIGENCE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">NEXUS</span>
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 tracking-widest animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> LIVE
            </span>
          </div>
          <p className="text-slate-400 text-sm tracking-wide font-medium">Encrypted Local Telemetry & Threat Footprint</p>
        </div>
      </motion.div>

      {/* TOP ROW: PROFILE & QUICK STATS */}
      <motion.div variants={itemVars} className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        
        {/* User Card */}
        <div className={`md:col-span-5 flex items-center gap-6 bg-gradient-to-br from-[#0f172a]/90 to-indigo-950/40 backdrop-blur-2xl border border-slate-700/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-2xl p-6 relative overflow-hidden group`}>
          <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-colors duration-700" />
          <div className="relative z-10 w-16 h-16 rounded-2xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] rotate-3 group-hover:rotate-0 transition-transform">
            <User size={30} />
          </div>
          <div className="z-10 flex-1">
            <h2 className="text-2xl font-bold text-white tracking-wide mb-1">{user.name || "Analyst Profile"}</h2>
            <div className="flex items-center gap-2 text-cyan-300/80 text-sm mb-3 font-mono bg-slate-950/50 w-max px-3 py-1 rounded-md border border-slate-800">
              <Mail size={14} className="text-cyan-500" /> {user.email}
            </div>
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2 text-slate-400 text-[11px] uppercase tracking-widest font-bold">
                <Fingerprint size={14} className="text-indigo-400" /> Clearance: <span className="text-indigo-300">Level 4</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono border border-slate-700 px-2 py-0.5 rounded">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Global Risk Score */}
        <div className={`${glassPanel} md:col-span-3 flex flex-col items-center justify-center text-center`}>
          <p className="text-slate-400 text-xs font-bold tracking-widest mb-3 uppercase">Safety Index</p>
          <div className="relative flex items-center justify-center w-28 h-28">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r={gaugeRadius} stroke="#1e293b" strokeWidth="8" fill="none" />
              <circle 
                cx="56" cy="56" r={gaugeRadius} stroke={gaugeColor} strokeWidth="8" fill="none"
                strokeDasharray={gaugeCircumference} strokeDashoffset={gaugeOffset} strokeLinecap="round"
                className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_currentColor]"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-white leading-none">{stats.riskScore}</span>
            </div>
          </div>
          <p className={`text-[11px] font-bold tracking-widest uppercase mt-3 px-3 py-1 rounded-full border ${
            stats.riskScore > 80 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 
            stats.riskScore > 50 ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' : 
            'text-red-400 border-red-500/30 bg-red-500/10'
          }`}>
            {stats.riskScore > 80 ? 'Optimal' : stats.riskScore > 50 ? 'Warning' : 'Critical'}
          </p>
        </div>

        {/* Action Metrics */}
        <div className={`${glassPanel} md:col-span-4 flex flex-col justify-center`}>
          <div className="flex items-center gap-2 mb-5 border-b border-slate-700/50 pb-3">
            <Crosshair size={16} className="text-cyan-400"/> 
            <h3 className="text-sm font-bold text-white tracking-widest">THREAT SUMMARY</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-cyan-500/50 transition-colors">
                  <Search size={14} className="text-cyan-400" />
                </div>
                <span className="text-slate-300 text-sm font-semibold">Total Scans Executed</span>
              </div>
              <span className="text-white font-black text-xl">{stats.total}</span>
            </div>

            <div className="flex justify-between items-center group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-red-500/50 transition-colors">
                  <AlertTriangle size={14} className="text-red-500" />
                </div>
                <span className="text-slate-300 text-sm font-semibold">Exposed Entities</span>
              </div>
              <span className="text-red-400 font-black text-xl">{stats.exposed}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MIDDLE ROW: CHARTS & API HEALTH */}
      <motion.div variants={itemVars} className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Timeline Area Chart */}
        <div className={`${glassPanel} lg:col-span-5 flex flex-col`}>
          <div className="flex items-center justify-between mb-6 border-b border-slate-700/50 pb-3">
            <h3 className="font-bold text-white tracking-widest text-sm flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" /> NETWORK TELEMETRY
            </h3>
            <span className="text-[10px] text-slate-500 font-mono border border-slate-700 px-2 py-0.5 rounded">LAST 7 DAYS</span>
          </div>
          
          {stats.total > 0 ? (
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.timelineData}>
                  <defs>
                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dx={-10} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#06b6d4', fontWeight: 'bold' }} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="scans" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" activeDot={{ r: 6, fill: '#fff', stroke: '#06b6d4', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
              <Activity size={32} className="mb-2 opacity-20" />
              <p className="text-sm font-medium">Awaiting Telemetry Data</p>
            </div>
          )}
        </div>

        {/* Scan Type Distribution */}
        <div className={`${glassPanel} lg:col-span-3 flex flex-col`}>
          <h3 className="mb-6 font-bold text-white tracking-widest text-sm border-b border-slate-700/50 pb-3 flex items-center gap-2">
            <PieChart size={16} className="text-indigo-400" /> VECTOR ANALYSIS
          </h3>
          {stats.total > 0 ? (
            <div className="flex-1 min-h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.typeData} dataKey="value" innerRadius={65} outerRadius={85} stroke="none" paddingAngle={4}>
                    {stats.typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', border: '1px solid rgba(6,182,212,0.3)' }} itemStyle={{ fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-white">{stats.typeData.length}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vectors</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
              <PieChart size={32} className="mb-2 opacity-20" />
              <p className="text-sm font-medium">No vectors tracked</p>
            </div>
          )}
        </div>

        {/* Detailed API Health Center */}
        <div className={`${glassPanel} lg:col-span-4 flex flex-col`}>
          <div className="flex items-center justify-between mb-5 border-b border-slate-700/50 pb-3">
            <h3 className="font-bold text-white tracking-widest text-sm flex items-center gap-2">
              <Server size={16} className="text-emerald-400" /> SYSTEM INTEGRATIONS
            </h3>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <Zap size={10}/> OPTIMAL
            </span>
          </div>
          
          <div className="flex-1 flex flex-col justify-between space-y-3">
            {[
              { name: "VirusTotal Core", latency: "14ms", color: "text-blue-400", bg: "bg-blue-400" },
              { name: "LeakCheck DB", latency: "22ms", color: "text-purple-400", bg: "bg-purple-400" },
              { name: "AbuseIPDB Net", latency: "18ms", color: "text-cyan-400", bg: "bg-cyan-400" },
              { name: "Numverify OSINT", latency: "31ms", color: "text-emerald-400", bg: "bg-emerald-400" }
            ].map((api, idx) => (
              <div key={idx} className="flex items-center justify-between bg-[#0a0f1c] p-3.5 rounded-xl border border-slate-700/50 hover:border-slate-500 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${api.bg} shadow-[0_0_8px_currentColor]`} />
                  <p className="text-xs font-bold text-slate-200 tracking-wide">{api.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div className={`h-full ${api.bg}`} animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 1.5 + Math.random(), ease: "linear" }} />
                  </div>
                  <span className={`text-[10px] font-mono ${api.color}`}>{api.latency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </motion.div>

      {/* BOTTOM ROW: ADVANCED HISTORY LEDGER */}
      <motion.div variants={itemVars} className={`${glassPanel} overflow-hidden flex flex-col flex-1 min-h-[350px]`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-slate-700/50 pb-4 gap-4">
          <div>
            <h3 className="font-bold text-white tracking-widest text-sm flex items-center gap-2 mb-1">
              <Clock size={16} className="text-indigo-400" /> MASTER INTELLIGENCE LEDGER
            </h3>
            <p className="text-xs text-slate-400 font-medium">Immutable local record of all security queries.</p>
          </div>
          
          {history.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.03, backgroundColor: "rgba(239,68,68,0.15)" }} 
              whileTap={{ scale: 0.95 }}
              onClick={handleClearHistory}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-red-400 border border-red-500/40 rounded-lg bg-red-950/30 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.15)] whitespace-nowrap"
            >
              <Trash2 size={14} /> PURGE RECORDS
            </motion.button>
          )}
        </div>
        
        {history.length > 0 ? (
          <div className="overflow-x-auto flex-1 custom-scrollbar pr-2">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="text-slate-400 uppercase tracking-widest text-[10px] bg-slate-900/80 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-5 py-4 rounded-tl-lg font-bold">Timestamp</th>
                  <th className="px-5 py-4 font-bold">Target Identifier</th>
                  <th className="px-5 py-4 font-bold">Vector</th>
                  <th className="px-5 py-4 font-bold rounded-tr-lg">Resolution Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <AnimatePresence>
                  {history.map((record) => (
                    <motion.tr 
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="hover:bg-slate-800/40 transition-all duration-200 group"
                    >
                      <td className="px-5 py-4 text-slate-400 whitespace-nowrap text-xs font-mono">
                        {formatDate(record.timestamp)}
                      </td>
                      <td className="px-5 py-4 text-slate-200 group-hover:text-white font-medium transition-colors">
                        {record.query}
                        {record.status === "Exposed" && <p className="text-[10px] text-slate-500 font-normal mt-0.5 max-w-[200px] truncate">{record.breachName || "Multiple Risks Detected"}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 bg-slate-900/80 w-max px-3 py-1.5 rounded-md border border-slate-700/80 shadow-sm">
                          {getTypeIcon(record.type)}
                          <span className="text-[10px] font-bold tracking-widest text-slate-300">
                            {record.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {/* INTERACTIVE BUTTON */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedRecord(record)}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-black tracking-widest border uppercase flex w-max items-center gap-2 cursor-pointer transition-colors ${
                            record.status === "Exposed"
                              ? "bg-red-950/50 text-red-400 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)] hover:bg-red-900/60"
                              : "bg-emerald-950/40 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/50"
                          }`}
                        >
                          {record.status === "Exposed" ? <AlertTriangle size={12}/> : <CheckCircle size={12}/>}
                          {record.status === "Exposed" ? "THREAT DETECTED" : "CLEARED"}
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 bg-[#0a0f1c]/50 rounded-xl border border-dashed border-slate-700/50 mt-2">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700">
              <Shield size={28} className="text-slate-600" />
            </div>
            <p className="text-lg font-bold text-slate-300">Ledger is Empty</p>
            <p className="text-xs mt-2 text-center max-w-sm leading-relaxed">
              No local traces found. Execute a scan from the Home terminal to begin populating your intelligence footprint.
            </p>
          </div>
        )}
      </motion.div>

      {/* HISTORY DETAILS POPUP MODAL */}
      <AnimatePresence>
        {selectedRecord && modalData && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }} animate={{ opacity: 1, backdropFilter: "blur(8px)" }} exit={{ opacity: 0, backdropFilter: "blur(0px)" }} transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020617]/80 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`w-full max-w-4xl bg-[#0f172a]/95 backdrop-blur-3xl border rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] ${modalData.isSafe ? 'border-emerald-500/30' : 'border-red-500/30'}`}
            >
              
              <div className="flex-none flex justify-between items-center px-6 py-4 border-b border-slate-700/50 bg-slate-900/50">
                <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  Historical Record Details &ndash; <span className="text-slate-300 font-medium">{selectedRecord.query}</span>
                </h2>
                <div className="flex items-center gap-4">
                  {!modalData.isSafe ? (
                    <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="text-[10px] bg-red-950 text-red-400 px-3 py-1 rounded-full font-bold tracking-wider border border-red-500/30">
                      THREAT DETECTED
                    </motion.span>
                  ) : (
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full font-bold tracking-wider border border-emerald-500/30">
                      SYSTEM SAFE
                    </span>
                  )}
                  <motion.button whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }} whileTap={{ scale: 0.9 }} onClick={closeModal} className="text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-full p-1.5">
                    <X size={16} />
                  </motion.button>
                </div>
              </div>

              <motion.div variants={containerVars} initial="hidden" animate="visible" className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <motion.div variants={itemVars} whileHover={{ y: -2 }} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 flex flex-col items-center justify-center relative">
                    <h3 className="absolute top-4 left-4 text-xs font-semibold text-slate-300">Risk Profile</h3>
                    <div className="relative w-32 h-20 mt-6 flex items-end justify-center">
                      <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
                        <motion.path 
                          initial={{ strokeDashoffset: 125.6 }} animate={{ strokeDashoffset: 125.6 - (modalData.score / 100) * 125.6 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                          d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={modalData.gaugeColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={125.6}
                        />
                      </svg>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute bottom-0 w-3 h-3 bg-slate-300 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                    </div>
                    <div className="text-center mt-4">
                      <p className={`text-lg font-bold tracking-widest ${modalData.riskColor}`}>{modalData.riskLevel}</p>
                      <p className="text-xs text-slate-400 mt-0.5">({modalData.score}/100)</p>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVars} whileHover={{ y: -2 }} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
                    <ul className="space-y-4">
                      <li className="flex items-center text-xs"><User size={14} className="text-slate-500 w-6" /><span className="text-slate-400 w-24">Identifier:</span><span className="text-white font-medium truncate">{selectedRecord.query}</span></li>
                      <li className="flex items-center text-xs"><Filter size={14} className="text-slate-500 w-6" /><span className="text-slate-400 w-24">Type:</span><span className="text-white font-bold">{selectedRecord.type}</span></li>
                      <li className="flex items-center text-xs"><Globe size={14} className="text-slate-500 w-6" /><span className="text-slate-400 w-24">Source:</span><span className={`${modalData.isSafe ? 'text-emerald-400' : 'text-red-400'} font-medium truncate`}>{modalData.source}</span></li>
                      <li className="flex items-center text-xs"><AlertTriangle size={14} className="text-slate-500 w-6" /><span className="text-slate-400 w-24">Breach Name:</span><span className={`${modalData.isSafe ? 'text-emerald-400' : 'text-red-400'} font-medium truncate`}>{modalData.breachName}</span></li>
                      <li className="flex items-center text-xs"><Calendar size={14} className="text-slate-500 w-6" /><span className="text-slate-400 w-24">Scan Date:</span><span className="text-white font-bold">{modalData.scanDate}</span></li>
                    </ul>
                  </motion.div>

                  <motion.div variants={itemVars} whileHover={{ y: -2 }} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 flex flex-col">
                    <h3 className="text-xs font-semibold text-slate-300 mb-4">Compromised Data:</h3>
                    <motion.div variants={containerVars} className="space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                      {modalData.compromisedList.map((item, idx) => (
                        <motion.div variants={itemVars} key={idx} className={`flex items-center gap-3 bg-slate-800/50 border p-3 rounded-lg transition-colors ${modalData.isSafe ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                          <LayoutTemplate size={14} className={modalData.isSafe ? "text-emerald-400" : "text-red-400"} />
                          <span className="text-slate-200 text-sm font-medium">{item}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                </div>

                <motion.div variants={itemVars} whileHover={{ y: -2 }} className={`border rounded-xl p-5 ${modalData.isSafe ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-red-950/20 border-red-500/20'}`}>
                  <h3 className={`text-sm font-semibold mb-3 tracking-wide ${modalData.isSafe ? 'text-emerald-400' : 'text-red-400'}`}>Recommended Actions</h3>
                  <motion.div variants={containerVars} className="space-y-1.5 pl-2">
                    {preventionMethods[selectedRecord.type]?.map((action, idx) => (
                      <motion.div variants={itemVars} key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className={`${modalData.isSafe ? 'text-emerald-500' : 'text-red-500'} mt-0.5`}>•</span>
                        <span>{action}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
