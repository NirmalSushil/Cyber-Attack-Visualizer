import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, Lock, User, Smartphone, AtSign, ArrowRight, Sun, Moon, Eye, EyeOff, CheckCircle, Sparkles, Fingerprint, Radar, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";

const API = import.meta?.env?.VITE_API_URL || "http://localhost:5000";

function InputField({ name, placeholder, type, icon: Icon, value, onChange, accent }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <Icon
        size={14}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
        style={{ color: focused ? (accent || "var(--accent)") : "var(--text-faint)" }}
      />
      <input
        type={type || "text"}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        autoComplete={type === "password" ? "new-password" : "off"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="auth-input w-full pl-10 pr-3 py-3.5"
        style={{ fontSize: 14 }}
      />
    </div>
  );
}

function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ chars", pass: password.length >= 8 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Symbol", pass: /[^A-Za-z0-9]/.test(password) }
  ];
  const score = checks.filter((check) => check.pass).length;
  const colors = ["#f43f5e", "#f97316", "#eab308", "#22c55e"];
  const labels = ["Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-1.5 px-0.5">
      <div className="mb-1.5 flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: index < score ? colors[score - 1] : "var(--border)" }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span style={{ fontSize: 10, fontFamily: "IBM Plex Mono", color: score > 0 ? colors[score - 1] : "var(--text-faint)" }}>
          {score > 0 ? labels[score - 1] : "Enter password"}
        </span>
        <div className="flex flex-wrap justify-end gap-2">
          {checks.map((check) => (
            <span
              key={check.label}
              className="flex items-center gap-0.5"
              style={{ fontSize: 9, fontFamily: "IBM Plex Mono", color: check.pass ? "#22c55e" : "var(--text-faint)" }}
            >
              <CheckCircle size={9} style={{ opacity: check.pass ? 1 : 0.35 }} />
              {check.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate("/login"), 1400);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [success, navigate]);

  const hName = useCallback((event) => { setName(event.target.value); setError(""); }, []);
  const hUser = useCallback((event) => { setUsername(event.target.value); setError(""); }, []);
  const hEmail = useCallback((event) => { setEmail(event.target.value); setError(""); }, []);
  const hPhone = useCallback((event) => { setPhone(event.target.value); setError(""); }, []);
  const hPwd = useCallback((event) => { setPassword(event.target.value); setError(""); }, []);
  const hConfirm = useCallback((event) => { setConfirmPassword(event.target.value); setError(""); }, []);

  const handleRegister = async (event) => {
    event.preventDefault();
    if (!agreeTerms) return setError("You must agree to the Terms & Privacy Policy.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const response = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          email,
          phone,
          password
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Registration failed.");
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Unable to connect to backend registration service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${dark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute inset-0 ${dark ? "bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.10),transparent_30%),linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)]" : "bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.15),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_30%),linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)]"} bg-[size:100%_100%,100%_100%,28px_28px,28px_28px] opacity-80`} />
        <div className={`absolute -top-24 right-0 h-72 w-72 rounded-full blur-3xl ${dark ? "bg-sky-500/15" : "bg-sky-400/15"}`} />
        <div className={`absolute bottom-0 left-0 h-80 w-80 rounded-full blur-3xl ${dark ? "bg-blue-500/10" : "bg-cyan-400/12"}`} />
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

      <div className="relative z-10 mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex items-center px-6 py-14 sm:px-10 lg:px-14 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-xl"
          >
            <div className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] ${dark ? "border-sky-500/20 bg-sky-500/10 text-sky-300" : "border-sky-200 bg-sky-50 text-sky-700"}`}>
              <Sparkles size={13} /> Create secure access
            </div>
            <h1 className="bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500 bg-clip-text text-5xl font-black tracking-[0.16em] text-transparent sm:text-6xl">
              CYBER ATTACK VISUALIZER
            </h1>
            <p className={`mt-4 max-w-lg text-lg leading-8 ${dark ? "text-slate-300" : "text-slate-600"}`}>
              Create a local account to access the scanner, keep your breach history organized, and use a cleaner, full-page registration flow.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Radar, title: "Fast setup", note: "Register in under a minute" },
                { icon: Fingerprint, title: "Safer", note: "Private local session storage" },
                { icon: Database, title: "History-ready", note: "Scan logs saved per user" }
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

        <section className="flex items-center justify-center px-6 pb-14 pt-4 sm:px-10 lg:px-14 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="w-full max-w-2xl"
          >
            <div className={`relative overflow-hidden rounded-[28px] border shadow-2xl ${dark ? "border-slate-700 bg-slate-950/85" : "border-slate-200 bg-white/92"}`}>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500" />
              <div className="p-6 sm:p-8">
                <div className="mb-7 flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${dark ? "border-sky-500/20 bg-sky-500/10" : "border-sky-200 bg-sky-50"}`}>
                    <Shield className="h-7 w-7 text-sky-500" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-[0.24em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Join the platform</p>
                    <h2 className="mt-1 text-2xl font-black">Create account</h2>
                  </div>
                </div>

                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-8 text-center"
                    >
                      <CheckCircle size={54} className="mx-auto mb-4 text-emerald-500" />
                      <p className="text-lg font-bold">Account created</p>
                      <p className={`mt-2 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>Redirecting to login...</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!success && (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InputField name="name" placeholder="Full name" icon={User} value={name} onChange={hName} />
                      <InputField name="username" placeholder="Username" icon={AtSign} value={username} onChange={hUser} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InputField name="email" placeholder="Email" icon={Mail} value={email} onChange={hEmail} type="email" />
                      <InputField name="phone" placeholder="Phone" icon={Smartphone} value={phone} onChange={hPhone} type="tel" />
                    </div>

                    <div className="relative">
                      <Lock size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                      <input
                        type={showPwd ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={password}
                        onChange={hPwd}
                        required
                        autoComplete="new-password"
                        className="auth-input w-full pl-10 pr-10 py-3.5"
                        style={{ fontSize: 14 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((value) => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)" }}
                      >
                        {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    <PasswordStrength password={password} />

                    <div className="relative">
                      <Lock size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={hConfirm}
                        required
                        autoComplete="new-password"
                        className="auth-input w-full pl-10 pr-3 py-3.5"
                        style={{ fontSize: 14 }}
                      />
                    </div>

                    <label className="flex cursor-pointer items-center gap-2.5 select-none pt-0.5">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(event) => {
                          setAgreeTerms(event.target.checked);
                          setError("");
                        }}
                        className="h-4 w-4 cursor-pointer rounded"
                        style={{ accentColor: "var(--accent)" }}
                      />
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        I agree to <span style={{ color: "var(--accent)", fontWeight: 600 }}>Terms</span> and <span style={{ color: "var(--accent)", fontWeight: 600 }}>Privacy Policy</span>
                      </span>
                    </label>

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
                          Creating account...
                        </>
                      ) : (
                        <>
                          <span>Create account</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </motion.button>
                  </form>
                )}

                {!success && (
                  <>
                    <div className="my-5 flex items-center gap-3">
                      <div className="h-px flex-1" style={{ background: "var(--divider)" }} />
                      <span style={{ fontSize: 10, letterSpacing: ".12em", color: "var(--text-faint)", textTransform: "uppercase", fontFamily: "IBM Plex Mono" }}>or</span>
                      <div className="h-px flex-1" style={{ background: "var(--divider)" }} />
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => alert("Google OAuth pending!")}
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
                      Sign up with Google
                    </motion.button>

                    <p className="mt-5 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
                      Already have an account?{" "}
                      <span onClick={() => navigate("/login")} className="cursor-pointer font-semibold" style={{ color: "var(--accent)" }}>
                        Log in
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
