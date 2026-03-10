import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { Shield, LayoutDashboard, Home, User, LogOut, ChevronDown } from "lucide-react";

import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import HomePage from "./components/HomePage";
import DashboardPage from "./components/DashboardPage";

const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const DashboardRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.isGuest) {
    return <Navigate to="/home" replace />;
  }
  return children;
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    setShowDropdown(false);
  }, [location.pathname]);

  const isActive = (path) => {
    return location.pathname === path
      ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
      : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent";
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setShowDropdown(false);
    navigate("/login");
  };

  const hideLayout =
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans flex flex-col">

      <div
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #1e293b 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {!hideLayout && (
        <nav className="relative z-20 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md px-6 py-4 flex justify-between items-center shadow-lg">

          <div className="flex items-center gap-3">
            <Shield className="text-cyan-400 w-8 h-8 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
            <div>
              <div className="font-black text-xl text-white tracking-widest">
                ECEBIP{" "}
                <span className="text-cyan-400 text-xs border border-cyan-500/50 px-1 rounded bg-cyan-950/30">
                  PRO
                </span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                G.V. Acharya Institute of Eng. & Tech.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 text-sm font-bold tracking-wide">
            
            <Link
              to="/home"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${isActive("/home")}`}
            >
              <Home size={18} />
              <span className="hidden md:inline">SCANNER HOME</span>
            </Link>

            {!user?.isGuest && (
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${isActive("/dashboard")}`}
              >
                <LayoutDashboard size={18} />
                <span className="hidden md:inline">THREAT DASHBOARD</span>
              </Link>
            )}

            {user && (
              <div className="relative ml-2 md:ml-4 pl-2 md:pl-4 border-l border-white/10">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors focus:outline-none"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:bg-slate-700 transition-colors">
                    <User size={18} />
                  </div>
                  <ChevronDown size={14} className={`text-slate-500 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-4 w-48 bg-[#0f172a]/95 backdrop-blur-2xl border border-slate-700 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-700 bg-white/5">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                        {user.isGuest ? "Access Level" : "Signed in as"}
                      </p>
                      <p className="text-sm font-bold text-white truncate">
                        {user.isGuest ? "Guest User" : (user.email || "Admin")}
                      </p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <LogOut size={16} />
                        {user.isGuest ? "Login / Register" : "Sign out"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </nav>
      )}

      <div className="flex-grow relative z-10">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<DashboardRoute><DashboardPage /></DashboardRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>

    </div>
  );
}

export default App;
