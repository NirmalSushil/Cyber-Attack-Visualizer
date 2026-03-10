import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Smartphone,
  Shield,
  CreditCard,
  Wifi,
  Link as LinkIcon,
  ChevronUp,
  X,
  AlertTriangle,
  User,
  Filter,
  Globe,
  Calendar,
  LayoutTemplate,
  Activity,
  Server,
  Crosshair
} from "lucide-react";

const HomePage = () => {
  const [mode, setMode] = useState("API");
  const [identifier, setIdentifier] = useState("");
  const [type, setType] = useState("EMAIL");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const scanTypes = [
    { id: "EMAIL", label: "Email", icon: <Mail size={20} /> },
    { id: "PHONE", label: "Phone", icon: <Smartphone size={20} /> },
    { id: "AADHAAR", label: "Aadhaar", icon: <Shield size={20} /> },
    { id: "PAN", label: "PAN", icon: <CreditCard size={20} /> },
    { id: "IP", label: "IP", icon: <Wifi size={20} /> },
    { id: "URL", label: "URL", icon: <LinkIcon size={20} /> }
  ];

  const preventionMethods = {
    EMAIL: ["Monitor financial transactions linked with Email.", "Enable Two-Factor Authentication (2FA) immediately.", "Check your connected accounts for unauthorized access.", "Avoid sharing sensitive data via email replies."],
    PHONE: ["Never share OTPs or banking PINs over phone calls.", "Be wary of SMS phishing (Smishing) containing links.", "Register number on Do Not Call (DND) registry.", "Contact your carrier to prevent SIM swapping."],
    AADHAAR: ["Lock your Aadhaar biometrics using mAadhaar app.", "Use Virtual ID (VID) instead of real Aadhaar number.", "Check your Aadhaar authentication history for anomalies.", "Never share unmasked photocopies of your Aadhaar."],
    PAN: ["Monitor financial transactions linked with PAN.", "Check your credit report for unknown loans.", "Avoid sharing PAN on untrusted websites.", "Report misuse to financial authorities."],
    IP: ["Restart your router to obtain a new dynamic IP.", "Use a reputable VPN to mask your traffic.", "Ensure router's firmware is updated.", "Run a full malware scan on connected devices."],
    URL: ["Do not enter any personal credentials on this domain.", "Report the malicious URL to Google Safe Browsing.", "Ensure browser web-protection is enabled.", "Clear browser cache, cookies, and history."]
  };

  const tickerData = [
    { name: "Global DNS Spoofing", target: "120 Govt IPs", severity: "CRITICAL", color: "bg-red-500", time: "Live" },
    { name: "LinkedIn Data Dump", target: "50M Records", severity: "HIGH", color: "bg-orange-500", time: "2m ago" },
    { name: "AWS S3 Bucket Leak", target: "2.4GB Data", severity: "MEDIUM", color: "bg-yellow-500", time: "15m ago" }
  ];

  useEffect(() => {
    if (type === "AADHAAR" || type === "PAN") {
      setMode("LOCAL");
    }
  }, [type]);

  const handleInputChange = (e) => {
    let val = e.target.value;

    if (type === "PHONE") val = val.replace(/\D/g, '').slice(0, 10);
    else if (type === "AADHAAR") val = val.replace(/\D/g, '').slice(0, 12);
    else if (type === "PAN") val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    
    setIdentifier(val);

    if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val)) setType("PAN");
    else if (/^\d{12}$/.test(val)) setType("AADHAAR");
    else if (/^\d{10}$/.test(val) && type !== "AADHAAR") setType("PHONE");
    else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) setType("EMAIL");
    else if (/^(https?:\/\/|www\.)/i.test(val)) setType("URL");
    else if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(val)) setType("IP");
  };

  const handleSearch = async () => {
    if (!identifier) return;
    if (type === "PAN" && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(identifier)) return alert("Invalid PAN format. Example: ABCDE1234F");
    if (type === "AADHAAR" && !/^[0-9]{12}$/.test(identifier)) return alert("Aadhaar must be exactly 12 digits.");
    if (type === "PHONE" && !/^[0-9]{10}$/.test(identifier)) return alert("Phone number must be exactly 10 digits.");

    setLoading(true);
    setResult(null);

    const currentQuery = identifier;
    let finalStatus = "Safe";
    let finalResultData = null; 

    try {
      let response;
      let data;

      if (mode === "API") {
        response = await fetch("http://localhost:5000/api/scan", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: currentQuery, type })
        });
        data = await response.json();
        finalStatus = data.status || "Safe";
        finalResultData = { ...data, scanType: type, queryId: currentQuery };
        setResult(finalResultData);
      } else {
        response = await fetch(`http://localhost:5000/api/attacks/search?query=${currentQuery}`);
        data = await response.json();

        if (!data || data.length === 0 || data[0].status?.toLowerCase() === "safe") {
          finalStatus = "Safe";
          finalResultData = { status: "Safe", scanType: type, queryId: currentQuery };
          setResult(finalResultData);
        } else {
          finalStatus = "Exposed";
          const record = data[0]; 
          finalResultData = {
            status: "Exposed", scanType: type, queryId: currentQuery, source: record.source, breachName: record.breachName || record.breachname, breachDate: record.breachDate || record.breachdate, compromisedData: record.compromisedData || record.compromiseddata, severityScore: record.severityScore || record.severityscore, scanDate: record.scanDate || record.scandate || new Date().toISOString().split('T')[0]
          };
          setResult(finalResultData);
        }
      }

      const currentUser = JSON.parse(localStorage.getItem("user"));
      if (currentUser && !currentUser.isGuest && currentUser.email) {
        const historyKey = `search_history_${currentUser.email}`;
        const pastHistory = JSON.parse(localStorage.getItem(historyKey)) || [];
        
        const newRecord = { 
          id: Date.now(), 
          query: currentQuery, 
          type: type, 
          status: finalStatus, 
          timestamp: new Date().toISOString(),
          source: finalResultData?.source,
          breachName: finalResultData?.breachName,
          compromisedData: finalResultData?.compromisedData,
          severityScore: finalResultData?.severityScore
        };
        
        localStorage.setItem(historyKey, JSON.stringify([newRecord, ...pastHistory]));
      }

      setIdentifier("");
    } catch (error) {
      console.error("Scan failed:", error);
    }
    
    setLoading(false);
  };

  const closeModal = () => setResult(null);

  const glassPanel = "bg-[#0f172a]/70 backdrop-blur-2xl border border-slate-700/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] rounded-2xl p-6 transition-all duration-300 hover:border-slate-500/50 relative overflow-hidden";

  const getModalData = () => {
    if (!result) return null;
    const isSafe = result.status === "Safe";
    const source = result.source;
    const breachName = result.breachName;
    const compromisedStr = result.compromisedData;
    const scanDate = result.scanDate || new Date().toISOString().split('T')[0];
    const compromisedList = compromisedStr ? compromisedStr.split(',').map(s => s.trim()) : (isSafe ? ["None"] : ["Unknown Data"]);
    const score = isSafe ? 0 : (result.severityScore ? parseInt(result.severityScore) : 89);
    
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

  const containerVars = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } } };
  const itemVars = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } } };
  const clickSpring = { type: "spring", stiffness: 400, damping: 17 };

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 blur-[120px] rounded-full mix-blend-screen" 
        />
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/20 blur-[120px] rounded-full mix-blend-screen" 
        />
      </div>

      <motion.div key="home-page-container" variants={containerVars} initial="hidden" animate="visible" className="flex-1 w-full flex flex-col px-4 md:px-8 py-6 overflow-y-auto relative z-10 custom-scrollbar font-sans text-slate-300">
        
        {/* Header Title */}
        <motion.div variants={itemVars} className="text-center mt-4 mb-10">
          <h2 className="text-5xl md:text-6xl font-black text-white tracking-widest mb-3 drop-shadow-xl">
            CYBER ATTACK <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">VISUALIZER</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-medium tracking-wide">Real-Time Breach Detection & Exposure Monitoring</p>
        </motion.div>

        {/* Search Panel */}
        <motion.div variants={itemVars} className={`max-w-4xl w-full mx-auto rounded-3xl p-8 mb-10 ${glassPanel}`}>
          <div className="flex justify-center mb-8">
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-full p-1.5 flex w-56 relative backdrop-blur-md shadow-inner">
              <motion.div 
                layout transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`absolute top-1.5 bottom-1.5 w-[48%] bg-slate-800 rounded-full border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)] ${mode === 'API' ? 'left-1.5' : 'left-[calc(50%-1px)]'}`}
              />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={clickSpring} onClick={() => setMode("API")} className={`flex-1 text-xs font-bold py-2 z-10 transition-colors tracking-wider ${mode === "API" ? "text-cyan-400" : "text-slate-400 hover:text-white"}`}>API</motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={clickSpring} onClick={() => setMode("LOCAL")} className={`flex-1 text-xs font-bold py-2 z-10 transition-colors tracking-wider ${mode === "LOCAL" ? "text-cyan-400" : "text-slate-400 hover:text-white"}`}>LOCAL</motion.button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <AnimatePresence>
              {scanTypes.map((t) => (
                <motion.button
                  key={t.id} whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }} whileTap={{ scale: 0.95 }} transition={clickSpring} onClick={() => setType(t.id)}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-xl border transition-colors ${
                    type === t.id ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md" : "bg-slate-800/50 border-slate-700/50 text-slate-400 backdrop-blur-sm hover:border-slate-600"
                  }`}
                >
                  {t.icon} <span className="text-sm md:text-base font-semibold tracking-wide">{t.label}</span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-4 p-2 bg-slate-900/60 backdrop-blur-2xl border border-cyan-500/20 rounded-2xl flex gap-3 shadow-[0_8px_32px_rgba(6,182,212,0.1)] focus-within:shadow-[0_8px_40px_rgba(6,182,212,0.2)] focus-within:border-cyan-500/50 transition-all duration-300">
            <input
              value={identifier} onChange={handleInputChange} placeholder={`Enter ${type.toLowerCase()}...`}
              className="flex-1 bg-transparent px-5 py-4 text-base text-white placeholder-slate-500 outline-none w-full"
            />
            <motion.button
              whileHover={!loading ? { scale: 1.02, boxShadow: "0 0 25px rgba(6,182,212,0.4)" } : {}}
              whileTap={!loading ? { scale: 0.95 } : {}}
              transition={clickSpring}
              onClick={handleSearch} 
              disabled={loading}
              className={`px-8 py-4 rounded-xl text-base font-bold min-w-[180px] shadow-[0_0_15px_rgba(6,182,212,0.2)] ${
                loading 
                ? "bg-slate-700 text-slate-300 cursor-not-allowed animate-pulse" 
                : "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:from-indigo-400 hover:to-cyan-400 transition-colors"
              }`}
            >
              {loading ? "SCANNING..." : "START SCAN"}
            </motion.button>
          </div>
        </motion.div>

        {/* BOTTOM WIDGETS AREA */}
        <motion.div variants={itemVars} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-auto max-w-5xl w-full mx-auto">
          
          {/* SYSTEM ONLINE STATUS ROW */}
          <div className="col-span-full mb-[-1rem] px-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
               <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
               </span>
               <p className="text-xs font-bold text-cyan-400 tracking-widest uppercase">Global Nodes Online</p>
            </div>
            <div className="text-[10px] text-slate-500 font-mono tracking-widest flex items-center gap-2">
              <Server size={12} className="text-slate-600" /> LATENCY: <span className="text-emerald-400">12ms</span>
            </div>
          </div>

          {/* RECENT BREACH TICKER */}
          <motion.div whileHover={{ y: -2 }} transition={clickSpring} className={glassPanel}>
            <div className="flex justify-between items-center mb-5 border-b border-slate-700/50 pb-3 relative z-10">
              <h3 className="text-sm font-bold text-white tracking-widest flex items-center gap-2">
                <Activity size={16} className="text-indigo-400" /> LIVE THREAT TICKER
              </h3>
              <span className="text-[9px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 tracking-wider">REAL-TIME</span>
            </div>
            
            <div className="space-y-3">
              {tickerData.map((item, i) => (
                <div key={i} className="group flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 hover:border-slate-500 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-2 h-2 rounded-full ${item.color} shadow-[0_0_8px_currentColor] animate-pulse`} />
                    <div>
                      <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{item.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Target: <span className="text-slate-400 font-mono">{item.target}</span></p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-[10px] font-mono text-slate-500 mb-1">{item.time}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      item.severity === 'CRITICAL' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                      item.severity === 'HIGH' ? 'text-orange-400 border-orange-500/30 bg-orange-500/10' :
                      'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                    }`}>
                      {item.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* NEW LIVE CYBER RADAR */}
          <motion.div whileHover={{ y: -2 }} transition={clickSpring} className={`${glassPanel} flex flex-col justify-between min-h-[220px] !p-0`}>
            
            <div className="flex justify-between items-center border-b border-slate-700/50 p-6 relative z-10 bg-[#0f172a]/40 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-white tracking-widest flex items-center gap-2">
                <Globe size={16} className="text-cyan-400" /> REGIONAL SURVEILLANCE
              </h3>
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_currentColor]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_currentColor]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_currentColor]"></span>
              </div>
            </div>
            
            {/* Radar Canvas Container */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-slate-950/50 rounded-b-2xl">
              
              {/* Cyber Grid Background */}
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{
                  backgroundImage: 'linear-gradient(rgba(6,182,212,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.2) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              />

              {/* Rotating Radar Sweep */}
              <div 
                className="absolute w-[200%] h-[200%] rounded-full animate-[spin_4s_linear_infinite] pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 75%, rgba(6,182,212,0.1) 90%, rgba(6,182,212,0.4) 100%)'
                }}
              />

              {/* Target Rings */}
              <div className="absolute w-64 h-64 border border-cyan-500/20 rounded-full pointer-events-none" />
              <div className="absolute w-40 h-40 border border-cyan-500/30 rounded-full border-dashed animate-[spin_15s_linear_infinite_reverse] pointer-events-none" />
              <div className="absolute w-16 h-16 border border-cyan-500/50 rounded-full flex items-center justify-center pointer-events-none">
                <Crosshair size={24} className="text-cyan-500/40 animate-pulse" />
              </div>

              {/* Nodes and Network Overlay */}
              <div className="relative w-full h-full pointer-events-none">
                 
                 {/* Interconnecting Network Lines */}
                 <svg className="absolute inset-0 w-full h-full opacity-60">
                   <path d="M 30% 45% L 50% 65% L 75% 35%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" fill="none" className="animate-pulse" />
                 </svg>

                 {/* Mumbai Node */}
                 <div className="absolute top-[45%] left-[30%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-10">
                   <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(6,182,212,1)]" />
                   <div className="absolute w-8 h-8 border border-cyan-400 rounded-full animate-ping opacity-50" />
                   <span className="mt-2 text-[10px] text-cyan-100 font-bold tracking-widest bg-slate-900/90 px-2 py-0.5 rounded border border-cyan-500/30 shadow-lg">MUMBAI</span>
                 </div>

                 {/* Pune Node */}
                 <div className="absolute top-[65%] left-[50%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-10">
                   <div className="w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,1)]" />
                   <span className="mt-2 text-[10px] text-indigo-100 font-bold tracking-widest bg-slate-900/90 px-2 py-0.5 rounded border border-indigo-500/30 shadow-lg">PUNE</span>
                 </div>

                 {/* Nagpur Node */}
                 <div className="absolute top-[35%] left-[75%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-10">
                   <div className="w-2.5 h-2.5 bg-purple-400 rounded-full shadow-[0_0_12px_rgba(168,85,247,1)]" />
                   <span className="mt-2 text-[10px] text-purple-100 font-bold tracking-widest bg-slate-900/90 px-2 py-0.5 rounded border border-purple-500/30 shadow-lg">NAGPUR</span>
                 </div>

              </div>

              {/* Background Watermark Icon */}
              <div className="absolute bottom-4 right-4 text-slate-700/30 pointer-events-none">
                <Shield size={90} strokeWidth={1} />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer Area */}
        <motion.footer variants={itemVars} className="mt-14 mb-4 border-t border-slate-800/60 pt-8 pb-4 text-center max-w-5xl w-full mx-auto">
          <p className="text-slate-500 text-xs mb-3 font-semibold tracking-widest uppercase">
            Development Team: Fardeen Akmal | Jigisha Naidu | Sushil Nirmal | Suvajit Ghosh
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-[9px] text-slate-600 font-mono tracking-widest uppercase">
            <span className="bg-slate-900/50 px-2 py-1 rounded border border-slate-800">DPDP Act 2023 Compliant</span>
            <span className="bg-slate-900/50 px-2 py-1 rounded border border-slate-800">ISO 27001 Protocol</span>
            <span className="bg-slate-900/50 px-2 py-1 rounded border border-slate-800">SHA-256 Encryption Active</span>
          </div>
        </motion.footer>

      </motion.div>

      {/* POPUP MODAL */}
      <AnimatePresence>
        {result && modalData && (
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
                  Scan Results &ndash; <span className="text-slate-300 font-medium">{result.queryId}</span>
                </h2>
                <div className="flex items-center gap-4">
                  {!modalData.isSafe ? (
                    <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="text-[10px] bg-red-950 text-red-400 px-3 py-1 rounded-full font-bold tracking-wider border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
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
                  <motion.div variants={itemVars} whileHover={{ y: -2 }} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 flex flex-col items-center justify-center relative shadow-inner">
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

                  <motion.div variants={itemVars} whileHover={{ y: -2 }} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 shadow-inner">
                    <ul className="space-y-4">
                      <li className="flex items-center text-xs"><User size={14} className="text-slate-500 w-6" /><span className="text-slate-400 w-24">Identifier:</span><span className="text-white font-medium truncate">{result.queryId}</span></li>
                      <li className="flex items-center text-xs"><Filter size={14} className="text-slate-500 w-6" /><span className="text-slate-400 w-24">Type:</span><span className="text-white font-bold">{result.scanType}</span></li>
                      <li className="flex items-center text-xs"><Globe size={14} className="text-slate-500 w-6" /><span className="text-slate-400 w-24">Source:</span><span className={`${modalData.isSafe ? 'text-emerald-400' : 'text-red-400'} font-medium truncate`}>{modalData.source || "N/A"}</span></li>
                      <li className="flex items-center text-xs"><AlertTriangle size={14} className="text-slate-500 w-6" /><span className="text-slate-400 w-24">Breach Name:</span><span className={`${modalData.isSafe ? 'text-emerald-400' : 'text-red-400'} font-medium truncate`}>{modalData.breachName || "N/A"}</span></li>
                      <li className="flex items-center text-xs"><Calendar size={14} className="text-slate-500 w-6" /><span className="text-slate-400 w-24">Scan Date:</span><span className="text-white font-bold">{modalData.scanDate}</span></li>
                    </ul>
                  </motion.div>

                  <motion.div variants={itemVars} whileHover={{ y: -2 }} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 flex flex-col shadow-inner">
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

                <motion.div variants={itemVars} whileHover={{ y: -2 }} className={`border rounded-xl p-5 shadow-inner ${modalData.isSafe ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-red-950/20 border-red-500/20'}`}>
                  <h3 className={`text-sm font-semibold mb-3 tracking-wide ${modalData.isSafe ? 'text-emerald-400' : 'text-red-400'}`}>Recommended Actions</h3>
                  <motion.div variants={containerVars} className="space-y-1.5 pl-2">
                    {preventionMethods[result.scanType]?.map((action, idx) => (
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
    </>
  );
};

export default HomePage;
