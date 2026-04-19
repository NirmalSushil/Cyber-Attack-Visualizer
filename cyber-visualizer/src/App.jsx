import React, { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, LayoutDashboard, Home as HomeIcon, User, LogOut, ChevronDown, BadgeCheck, Sun, Moon, Building2, Lock } from "lucide-react";

import { useTheme }    from "./ThemeContext";
import { getSession, clearSession } from "./userStorage";

const LoginPage = lazy(() => import("./components/LoginPage"));
const RegisterPage = lazy(() => import("./components/RegisterPage"));
const Home = lazy(() => import("./components/Home"));
const DashboardPage = lazy(() => import("./components/DashboardPage"));
const GovDashboard = lazy(() => import("./components/GovDashboard"));


const ProtectedRoute = ({ children }) => {
  const u = getSession();
  if (!u) return <Navigate to="/login" replace />;
  return children;
};
const DashboardRoute = ({ children }) => {
  const u = getSession();
  if (!u || u.isGuest) return <Navigate to="/home" replace />;
  return children;
};
const GovRoute = ({ children }) => {
  const u = getSession();
  if (!u || u.role !== "government") return <Navigate to="/home" replace />;
  return children;
};

export default function App() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const { dark, toggle } = useTheme();
  const [dropdown,     setDropdown]     = useState(false);
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [user,         setUser]         = useState(getSession());

 
  useEffect(() => { setUser(getSession()); setDropdown(false); }, [location.pathname]);

  useEffect(() => {
    const fn = e => setIsModalOpen(e.detail.isModalOpen);
    window.addEventListener("modalStateChange", fn);
    return () => window.removeEventListener("modalStateChange", fn);
  }, []);

 
  useEffect(() => {
    const fn = () => setDropdown(false);
    if (dropdown) document.addEventListener("click", fn, true);
    return () => document.removeEventListener("click", fn, true);
  }, [dropdown]);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    navigate("/login");
  };

  const hideNav = ["/login","/register"].includes(location.pathname) || isModalOpen;
  const isHome = location.pathname === "/home";
  const isActive = p => location.pathname === p;

 
  const navLink = active =>
    dark
      ? active ? "text-sky-400 bg-sky-400/10 border border-sky-400/20 shadow-[0_0_12px_-4px_rgba(56,189,248,.3)]"
               : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
      : active ? "text-sky-700 bg-sky-100/80 border border-sky-200 shadow-sm"
               : "text-slate-500 hover:text-slate-900 hover:bg-black/5 border border-transparent";

  const govLink = active =>
    dark
      ? active ? "text-cyan-400 bg-cyan-400/10 border border-cyan-400/25"
               : "text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/5 border border-transparent"
      : active ? "text-cyan-700 bg-cyan-100/80 border border-cyan-200"
               : "text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 border border-transparent";

  const isGov = user?.role === "government";
  const navShellClass = isHome
    ? "nav-glass relative z-20 mx-auto mt-3 mb-2 w-[min(1120px,calc(100%-1.5rem))] px-4 sm:px-6 py-3 flex justify-between items-center rounded-full shadow-[0_18px_60px_rgba(15,23,42,0.12)]"
    : "nav-glass relative z-20 mx-auto mt-3 mb-2 w-[min(1120px,calc(100%-1.5rem))] px-4 sm:px-6 py-3 flex justify-between items-center rounded-full";

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ fontFamily: "'DM Sans', sans-serif", background: "var(--bg-base)", color: "var(--text-primary)" }}>

     
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div style={{ position:"absolute", top:"-20%", left:"-10%", width:"55%", height:"55%",
          background: dark?"radial-gradient(ellipse,rgba(56,189,248,.055) 0%,transparent 70%)":"radial-gradient(ellipse,rgba(14,120,200,.07) 0%,transparent 70%)", filter:"blur(60px)" }}/>
        <div style={{ position:"absolute", bottom:"-20%", right:"-10%", width:"55%", height:"55%",
          background: dark?"radial-gradient(ellipse,rgba(99,102,241,.055) 0%,transparent 70%)":"radial-gradient(ellipse,rgba(8,145,178,.06) 0%,transparent 70%)", filter:"blur(60px)" }}/>
        <div style={{ position:"absolute", inset:0, opacity: dark ? .015 : .03,
          backgroundImage:"linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)",
          backgroundSize:"52px 52px" }}/>
      </div>

      {/* ── Navbar ── */}
      <AnimatePresence>
        {!hideNav && (
          <motion.nav
            initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className={navShellClass}>

            {/* Logo */}
            <motion.div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/home")}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: .98 }}>
              <Shield className="text-sky-500 w-7 h-7" style={{ filter: dark ? "drop-shadow(0 0 8px rgba(56,189,248,.55))" : "drop-shadow(0 0 8px rgba(3,105,161,.28))" }}/>
              <div>
                <div className="font-black text-[17px] tracking-widest flex items-center gap-1.5" style={{ color:"var(--text-primary)" }}>
                  <span className="bg-[linear-gradient(to_right,#ff8a00,#e5b061,#72aeb6,#0ea5e9)] bg-clip-text text-transparent">Cyber Attack Visualizer</span>
                  {isGov && <span style={{ fontSize:9, fontFamily:"IBM Plex Mono", color:"var(--gov-color)", border:"1px solid rgba(34,211,238,.3)", padding:"2px 6px", borderRadius:6, background:"var(--gov-soft)" }}>GOV</span>}
                </div>
                <div className="text-[9px] uppercase tracking-widest hidden sm:block" style={{ color:"var(--text-faint)" }}>
                  India cyber intelligence suite
                </div>
              </div>
            </motion.div>

            {/* Nav items */}
            <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">

              {/* Theme toggle */}
              <motion.button onClick={toggle} whileHover={{ scale:1.08 }} whileTap={{ scale:.92 }}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background:"var(--bg-glass)", border:"1px solid var(--border)", color: dark?"#fbbf24":"#4a7a9b" }}
                title={dark?"Light mode":"Dark mode"}>
                <AnimatePresence mode="wait">
                  <motion.span key={dark?"sun":"moon"} initial={{rotate:-90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:90,opacity:0}} transition={{duration:.18}}>
                    {dark ? <Sun size={15}/> : <Moon size={15}/>}
                  </motion.span>
                </AnimatePresence>
              </motion.button>

              <Link to="/home"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${navLink(isActive("/home"))}`}>
                <HomeIcon size={15}/><span className="hidden md:inline">Scanner</span>
              </Link>

              {user && !user.isGuest && !isGov && (
                <Link to="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${navLink(isActive("/dashboard"))}`}>
                  <LayoutDashboard size={15}/><span className="hidden md:inline">Dashboard</span>
                </Link>
              )}

              {isGov && (
                <Link to="/gov-dashboard"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${govLink(isActive("/gov-dashboard"))}`}>
                  <Building2 size={15}/><span className="hidden md:inline">Gov Dashboard</span>
                </Link>
              )}

              {/* User dropdown */}
              {user && (
                <div className="relative ml-1 pl-2 sm:pl-3 border-l" style={{ borderColor:"var(--divider)" }}>
                  <motion.button onClick={e=>{e.stopPropagation();setDropdown(v=>!v)}}
                    whileHover={{scale:1.04}} whileTap={{scale:.96}}
                    className="flex items-center gap-1.5 focus:outline-none">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: isGov?"var(--gov-soft)":"var(--accent-soft)", border:`1.5px solid ${isGov?"rgba(34,211,238,.35)":"var(--accent-border)"}`, color: isGov?"var(--gov-color)":"var(--accent)" }}>
                      {isGov ? <Building2 size={14}/> : <User size={14}/>}
                    </div>
                    <motion.span animate={{ rotate: dropdown ? 180 : 0 }} transition={{ duration:.2 }}>
                      <ChevronDown size={13} style={{ color:"var(--text-muted)" }}/>
                    </motion.span>
                  </motion.button>

                  <AnimatePresence>
                    {dropdown && (
                      <motion.div
                        initial={{ opacity:0, y:-8, scale:.96 }} animate={{ opacity:1, y:0, scale:1 }}
                        exit={{ opacity:0, y:-8, scale:.96 }} transition={{ type:"spring", stiffness:350, damping:28 }}
                        className="absolute right-0 mt-3 w-64 glass-2 rounded-2xl shadow-2xl overflow-hidden z-50"
                        style={{ border:"1px solid var(--border-glow)" }}>

                        {/* Header */}
                        <div className="px-4 py-4 border-b" style={{ borderColor:"var(--divider)", background: isGov?"var(--gov-soft)":"var(--accent-soft)" }}>
                          {user.isGuest ? (
                            <>
                              <p style={{ fontSize:9, fontFamily:"IBM Plex Mono", color:"var(--text-faint)", letterSpacing:".1em", textTransform:"uppercase" }}>Access Level</p>
                              <p className="font-bold mt-0.5" style={{ color:"var(--text-primary)" }}>Guest User</p>
                            </>
                          ) : (
                            <>
                              <p style={{ fontSize:9, fontFamily:"IBM Plex Mono", color:"var(--text-muted)", letterSpacing:".12em", textTransform:"uppercase", marginBottom:4 }}>Signed in as</p>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="font-bold truncate" style={{ color:"var(--text-primary)" }}>{user.name}</span>
                                <BadgeCheck size={13} style={{ color: isGov?"var(--gov-color)":"var(--accent)", flexShrink:0 }}/>
                              </div>
                              <span className="block truncate mb-2" style={{ fontSize:12, color:"var(--text-muted)" }}>{user.email}</span>
                              <div className="flex flex-wrap gap-1.5">
                                <span style={{ fontSize:9, fontFamily:"IBM Plex Mono", fontWeight:700, padding:"2px 8px", borderRadius:6, letterSpacing:".1em", textTransform:"uppercase",
                                  color: isGov?"var(--gov-color)":"var(--accent)", background: isGov?"var(--gov-soft)":"var(--accent-soft)", border:`1px solid ${isGov?"rgba(34,211,238,.3)":"var(--accent-border)"}` }}>
                                  {isGov ? "🔒 " : ""}{user.role}
                                </span>
                                {isGov && (
                                  <span style={{ fontSize:9, fontFamily:"IBM Plex Mono", fontWeight:700, padding:"2px 8px", borderRadius:6, letterSpacing:".1em",
                                    color:"#f43f5e", background:"rgba(244,63,94,.1)", border:"1px solid rgba(244,63,94,.25)" }}>
                                    {user.clearance}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="p-1.5" style={{ background:"var(--bg-glass)" }}>
                          {isGov && (
                            <button onClick={()=>{setDropdown(false);navigate("/gov-dashboard");}}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-1 row-hover"
                              style={{ color:"var(--gov-color)" }}>
                              <Building2 size={14}/> Government Dashboard
                            </button>
                          )}
                          <button onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all row-hover"
                            style={{ color:"var(--text-secondary)" }}>
                            <LogOut size={14}/>
                            {user.isGuest ? "Login / Register" : "Sign out"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── Routes ── */}
      <div className="flex-grow relative z-10">
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
              Loading...
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/"             element={<Navigate to="/login" replace/>}/>
              <Route path="/login"        element={<LoginPage    onLogin={u=>{setUser(u);}}/>}/>
              <Route path="/register"     element={<RegisterPage onRegister={()=>{}}/>}/>
              <Route path="/home"         element={<ProtectedRoute><Home/></ProtectedRoute>}/>
              <Route path="/dashboard"    element={<DashboardRoute><DashboardPage setIsModalOpen={setIsModalOpen}/></DashboardRoute>}/>
              <Route path="/gov-dashboard" element={<GovRoute><GovDashboard/></GovRoute>}/>
              <Route path="*"             element={<Navigate to="/login" replace/>}/>
            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>
    </div>
  );
}
