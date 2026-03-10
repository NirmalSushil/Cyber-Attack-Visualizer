import React, { useState } from "react";
import { Shield, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (form.password !== form.confirmPassword) { setLoading(false); return setError("Passwords do not match."); }
      if (form.password.length < 6) { setLoading(false); return setError("Password must be at least 6 characters."); }

      localStorage.setItem("user", JSON.stringify(form));
      navigate("/login");
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden font-sans py-10">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-[#0f172a]/60 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-10 shadow-[0_8px_40px_0_rgba(6,182,212,0.1)]">
          <div className="flex flex-col items-center gap-3 mb-8 justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-md" />
              <Shield className="text-cyan-400 w-12 h-12 relative z-10 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
            </div>
            <div className="text-center mt-2">
              <h1 className="text-2xl font-black text-white tracking-widest drop-shadow-md">
                CREATE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">ACCOUNT</span>
              </h1>
              <p className="text-slate-400 text-xs mt-1 font-medium tracking-wide">Register for ECEBIP PRO</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
              <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:bg-slate-800/80 transition-all backdrop-blur-md" />
            </div>
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
              <input type="email" name="email" placeholder="Email Address" value={form.email} onChange={handleChange} required className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:bg-slate-800/80 transition-all backdrop-blur-md" />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
              <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:bg-slate-800/80 transition-all backdrop-blur-md" />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
              <input type="password" name="confirmPassword" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:bg-slate-800/80 transition-all backdrop-blur-md" />
            </div>

            {error && <div className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 py-2 rounded-lg">{error}</div>}

            <div className="pt-3">
              <button type="submit" disabled={loading} className="w-full py-3.5 flex items-center justify-center gap-2 rounded-xl text-sm font-bold tracking-widest bg-gradient-to-r from-indigo-600 to-cyan-600 text-white hover:from-indigo-500 hover:to-cyan-500 transition-colors backdrop-blur-md shadow-lg active:scale-95">
                {loading ? "CREATING..." : "REGISTER"}
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>
          </form>

          <p onClick={() => navigate("/login")} className="text-xs text-slate-400 mt-8 text-center cursor-pointer hover:text-cyan-400 transition-colors tracking-wide">
            Already have an account? <span className="font-semibold text-slate-300">Login here</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
