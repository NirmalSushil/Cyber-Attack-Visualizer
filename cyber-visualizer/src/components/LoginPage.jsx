import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Shield, Lock, User, ArrowRight, UserCircle, Sun, Moon, Eye, EyeOff, Building2, Sparkles, Fingerprint, Radar, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { setSession } from "../userStorage";

const API = import.meta?.env?.VITE_API_URL || "http://localhost:5000";

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const [tab, setTab] = useState("user");
  const [loginId, setLoginId] = useState("");
  const [govId, setGovId] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => setError("");

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload =
        tab === "gov"
          ? { mode: "government", govId: govId.trim(), password }
          : { mode: "user", loginId: loginId.trim(), password };

      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Login failed.");
        return;
      }

      const found = data?.user;
      if (!found) {
        setError("Login failed.");
        return;
      }

      setSession(found);
      onLogin?.(found);
      navigate(found.role === "government" ? "/gov-dashboard" : "/home");
    } catch (err) {
      setError("Unable to connect to backend authentication service.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    const guest = { isGuest: true, name: "Guest User", role: "guest", department: "Public Access" };
    setSession(guest);
    onLogin?.(guest);
    navigate("/home");
  };

  const fieldShell = "auth-input w-full pl-10 pr-4 py-3.5";

  return (
    <div className={`min-h-screen relative overflow-hidden ${dark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute inset-0 ${dark ? "bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_32%),linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)]" : "bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_32%),linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)]"} bg-[size:100%_100%,100%_100%,28px_28px,28px_28px] opacity-80`} />
        <div className={`absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl ${dark ? "bg-sky-500/15" : "bg-sky-400/15"}`} />
        <div className={`absolute bottom-0 right-0 h-80 w-80 rounded-full blur-3xl ${dark ? "bg-blue-500/10" : "bg-cyan-400/12"}`} />
      </div>

      <motion.button
        onClick={toggle}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border shadow-lg backdrop-blur-xl"
        style={{ background: dark ? "rgba(15,23,42,.72)" : "rgba(255,255,255,.72)", borderColor: dark ? "rgba(148,163,184,.16)" : "rgba(148,163,184,.22)" }}
        title={dark ? "Light mode" : "Dark mode"}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={dark ? "sun" : "moon"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="flex items-center px-6 py-14 sm:px-10 lg:px-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-xl"
          >
            <div className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] ${dark ? "border-sky-500/20 bg-sky-500/10 text-sky-300" : "border-sky-200 bg-sky-50 text-sky-700"}`}>
              <Sparkles size={13} /> Secure Access Portal
            </div>
            <h1 className="bg-[linear-gradient(to_right,#ff8a00,#e5b061,#72aeb6,#0ea5e9)] bg-clip-text text-5xl font-black tracking-[0.16em] text-transparent sm:text-6xl">
              Cyber Attack Visualizer
            </h1>
            <p className={`mt-4 max-w-lg text-lg leading-8 ${dark ? "text-slate-300" : "text-slate-600"}`}>
              Sign in to scan identities, review history, and access the breach intelligence dashboard with a smoother, more focused workflow.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Radar, title: "Real-time", note: "Instant scan feedback" },
                { icon: Fingerprint, title: "Private", note: "Hashed identifiers" },
                { icon: Database, title: "Offline-ready", note: "Local lookup support" }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={`rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-900/60" : "border-slate-200 bg-white/85"}`}
                  >
                    <Icon size={17} className="text-sky-500" />
                    <p className="mt-3 text-sm font-bold">{item.title}</p>
                    <p className={`mt-1 text-xs leading-5 ${dark ? "text-slate-400" : "text-slate-500"}`}>{item.note}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </section>

        <section className="flex items-center justify-center px-6 pb-14 pt-4 sm:px-10 lg:px-14 lg:py-14">
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="w-full max-w-lg"
          >
            <div className={`relative overflow-hidden rounded-[28px] border shadow-2xl ${dark ? "border-slate-700 bg-slate-950/85" : "border-slate-200 bg-white/92"}`}>
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500`} />
              <div className="p-6 sm:p-8">
                <div className="mb-7 flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${dark ? "border-sky-500/20 bg-sky-500/10" : "border-sky-200 bg-sky-50"}`}>
                    <Shield className="h-7 w-7 text-sky-500" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-[0.24em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Welcome back</p>
                    <h2 className="mt-1 text-2xl font-black">Sign in</h2>
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border p-1" style={{ borderColor: dark ? "rgba(148,163,184,.14)" : "rgba(148,163,184,.22)" }}>
                  {[
                    { id: "user", icon: User, label: "User Login" },
                    { id: "gov", icon: Building2, label: "Government" }
                  ].map((item) => {
                    const ActiveIcon = item.icon;
                    const active = tab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setTab(item.id);
                          reset();
                          setLoginId("");
                          setPassword("");
                          setGovId("");
                        }}
                        className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${active ? "shadow-md" : "opacity-80"}`}
                        style={{
                          background: active ? (item.id === "gov" ? (dark ? "rgba(34,211,238,.12)" : "rgba(34,211,238,.10)") : (dark ? "rgba(56,189,248,.12)" : "rgba(14,165,233,.10)")) : "transparent",
                          color: active ? (item.id === "gov" ? "var(--gov-color)" : "var(--accent)") : (dark ? "#94a3b8" : "#64748b")
                        }}
                      >
                        <ActiveIcon size={14} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {tab === "gov" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="gov-badge mb-5 rounded-2xl px-4 py-3">
                        <div className="flex items-start gap-3">
                          <Lock size={14} className="mt-0.5 text-cyan-500" />
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-400">Government access only</p>
                            <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>Demo credentials: GOV-CERT-001 / gov@secure123</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleLogin} className="space-y-3.5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tab}
                      initial={{ opacity: 0, x: tab === "gov" ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3.5"
                    >
                      {tab === "user" ? (
                        <div className="relative">
                          <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                          <input
                            value={loginId}
                            onChange={(e) => {
                              setLoginId(e.target.value);
                              reset();
                            }}
                            placeholder="Email or username"
                            required
                            className={fieldShell}
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--gov-color)" }} />
                          <input
                            value={govId}
                            onChange={(e) => {
                              setGovId(e.target.value);
                              reset();
                            }}
                            placeholder="Government ID"
                            required
                            className={fieldShell}
                          />
                        </div>
                      )}

                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                        <input
                          type={showPwd ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            reset();
                          }}
                          placeholder="Password"
                          required
                          className={`${fieldShell} pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)" }}
                        >
                          {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-2xl border px-4 py-3 text-center text-xs font-medium"
                        style={{ color: "#f43f5e", background: "rgba(244,63,94,.08)", borderColor: "rgba(244,63,94,.2)" }}
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-1">
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={!loading ? { scale: 1.01 } : {}}
                      whileTap={!loading ? { scale: 0.98 } : {}}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition disabled:opacity-70"
                      style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)", boxShadow: "0 10px 30px -14px rgba(14,165,233,.6)" }}
                    >
                      {loading ? (
                        <>
                          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                            <Shield size={15} />
                          </motion.span>
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <span>{tab === "gov" ? "GOV LOGIN" : "LOG IN"}</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </motion.button>
                  </div>

                  {tab === "user" && (
                    <motion.button
                      type="button"
                      onClick={handleGuest}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.2em]"
                      style={{ background: dark ? "rgba(15,23,42,.6)" : "rgba(248,250,252,.95)", borderColor: dark ? "rgba(148,163,184,.14)" : "rgba(148,163,184,.22)", color: "var(--text-secondary)" }}
                    >
                      Skip Login <UserCircle size={14} />
                    </motion.button>
                  )}
                </form>

                {tab === "user" && (
                  <>
                    <div className="my-5 flex items-center gap-3">
                      <div className="h-px flex-1" style={{ background: "var(--divider)" }} />
                      <span style={{ fontSize: 10, letterSpacing: ".12em", color: "var(--text-faint)", textTransform: "uppercase", fontFamily: "IBM Plex Mono" }}>or</span>
                      <div className="h-px flex-1" style={{ background: "var(--divider)" }} />
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => alert("Google OAuth integration pending!")}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex w-full items-center justify-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all"
                      style={{ background: dark ? "rgba(15,23,42,.6)" : "rgba(248,250,252,.95)", borderColor: dark ? "rgba(148,163,184,.14)" : "rgba(148,163,184,.22)", color: "var(--text-primary)" }}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Sign in with Google
                    </motion.button>

                    <p className="mt-5 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
                      Don&apos;t have an account?{" "}
                      <span onClick={() => navigate("/register")} className="cursor-pointer font-semibold" style={{ color: "var(--accent)" }}>
                        Sign up
                      </span>
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
