import React, { useState } from "react";
import { Shield, Lock, Mail, ArrowRight, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser && !storedUser.isGuest && email === storedUser.email && password === storedUser.password) {
        navigate("/home");
      } else {
        setError("Invalid credentials. Please try again.");
      }
      setLoading(false);
    }, 800);
  };

  const handleSkipLogin = () => {
    localStorage.setItem("user", JSON.stringify({ isGuest: true }));
    navigate("/home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden font-sans">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-[#0f172a]/60 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-10 shadow-[0_8px_40px_0_rgba(6,182,212,0.1)]">
          <div className="flex flex-col items-center gap-3 mb-8 justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-md" />
              <Shield className="text-cyan-400 w-12 h-12 relative z-10 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
            </div>
            <div className="text-center mt-2">
              <h1 className="text-3xl font-black text-white tracking-widest drop-shadow-md">
                ECEBIP <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">PRO</span>
              </h1>
              <p className="text-slate-400 text-xs mt-1 font-medium tracking-wide">Secure Access Portal</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
              <input type="email" placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:bg-slate-800/80 transition-all backdrop-blur-md" />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:bg-slate-800/80 transition-all backdrop-blur-md" />
            </div>

            {error && <div className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 py-2 rounded-lg transition-all">{error}</div>}

            <div className="pt-2 flex flex-col gap-3">
              <button type="submit" disabled={loading} className="w-full py-3.5 flex items-center justify-center gap-2 rounded-xl text-sm font-bold tracking-widest bg-gradient-to-r from-indigo-600 to-cyan-600 text-white hover:from-indigo-500 hover:to-cyan-500 transition-colors backdrop-blur-md shadow-lg active:scale-95">
                {loading ? "AUTHENTICATING..." : "LOGIN"}
                {!loading && <ArrowRight size={16} />}
              </button>

              <button type="button" onClick={handleSkipLogin} disabled={loading} className="w-full py-3.5 flex items-center justify-center gap-2 rounded-xl text-sm font-bold tracking-widest bg-transparent text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-white transition-colors backdrop-blur-md active:scale-95">
                SKIP LOGIN <UserCircle size={16} />
              </button>
            </div>
          </form>

          <p onClick={() => navigate("/register")} className="text-xs text-slate-400 mt-8 text-center cursor-pointer hover:text-cyan-400 transition-colors tracking-wide">
            Don't have an account? <span className="font-semibold text-slate-300">Create one</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
