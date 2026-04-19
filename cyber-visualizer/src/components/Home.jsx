import React, { useCallback, useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Lock, Search, Shield, Smartphone, Mail, Globe2, BadgeInfo, RefreshCw, Database, ShieldAlert, Clock3, Fingerprint, FileSearch, BadgeCheck } from "lucide-react";
import { useTheme } from "../ThemeContext";

const API = import.meta?.env?.VITE_API_URL || "http://localhost:5000";
const SCAN_TYPES = ["EMAIL", "PHONE", "IP", "AADHAAR", "PAN", "URL"];

const TYPE_META = {
  EMAIL: { label: "Email", placeholder: "name@example.com", icon: Mail },
  PHONE: { label: "Phone", placeholder: "9876543210", icon: Smartphone },
  IP: { label: "IP Address", placeholder: "192.168.1.1", icon: Globe2 },
  AADHAAR: { label: "Aadhaar", placeholder: "123456789012", icon: BadgeInfo },
  PAN: { label: "PAN", placeholder: "ABCDE1234F", icon: BadgeInfo },
  URL: { label: "URL", placeholder: "https://example.com", icon: Globe2 }
};

const PREVENTION = {
  EMAIL: [
    "Change mailbox password immediately",
    "Enable 2FA or passkeys on email and recovery accounts",
    "Review connected apps and forwarding rules",
    "Monitor for phishing and password reset abuse"
  ],
  PHONE: [
    "Enable SIM-swap protection with your carrier",
    "Use app-based 2FA instead of SMS OTPs",
    "Never share OTPs or banking credentials via SMS",
    "Block suspicious numbers and report abuse"
  ],
  IP: [
    "Rotate exposed credentials and revoke sessions",
    "Patch services and close unused ports",
    "Use firewall or reverse proxy for assets",
    "Monitor logs for scanning and intrusion attempts"
  ],
  AADHAAR: [
    "Never share full Aadhaar unless required",
    "Use Virtual ID (VID) when possible",
    "Lock biometrics in mAadhaar app",
    "Monitor for document misuse and fraud"
  ],
  PAN: [
    "Avoid credential reuse on PAN-linked services",
    "Check CIBIL and ITR for unauthorized activity",
    "Keep copies restricted and masked",
    "Update passwords on financial accounts"
  ],
  URL: [
    "Never enter credentials on suspicious domains",
    "Verify certificates and domain spelling",
    "Use browser phishing protection",
    "Clear cookies and site storage if compromised"
  ]
};

function toTitle(value = "") {
  return value
    .toString()
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function maskValue(value = "") {
  const text = value.toString().trim();
  if (!text) return "Hidden";
  if (text.length <= 8) return `${text.slice(0, 2)}***${text.slice(-1)}`;
  return `${text.slice(0, 3)}${"*".repeat(Math.max(4, text.length - 7))}${text.slice(-3)}`;
}

async function hashValue(value = "") {
  const text = value.toString().trim();
  if (!text) return "";

  if (globalThis.crypto?.subtle) {
    const encoded = new TextEncoder().encode(text);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .slice(0, 12)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(16);
}

function formatDate(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.toString();
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function normalizeInputByType(type, value) {
  const raw = String(value ?? "");

  if (type === "PHONE") {
    return raw.replace(/\D/g, "").slice(0, 10);
  }

  if (type === "AADHAAR") {
    return raw.replace(/\D/g, "").slice(0, 12);
  }

  if (type === "PAN") {
    return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);
  }

  return raw;
}

function maxLengthByType(type) {
  if (type === "PHONE") return 10;
  if (type === "AADHAAR") return 12;
  if (type === "PAN") return 10;
  return undefined;
}

function Home() {
  const { dark } = useTheme();
  const [selectedType, setSelectedType] = useState("EMAIL");
  const [identifier, setIdentifier] = useState("");
  const [useLocalDb, setUseLocalDb] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [scanning, setScanning] = useState(0);
  const [privacyFingerprint, setPrivacyFingerprint] = useState("");

  const PreventionItems = useMemo(() => PREVENTION[selectedType] || PREVENTION.EMAIL, [selectedType]);

  // Auto-enable local DB for Aadhaar and PAN
  useEffect(() => {
    if (selectedType === "AADHAAR" || selectedType === "PAN") {
      setUseLocalDb(true);
    } else {
      setUseLocalDb(false);
    }
  }, [selectedType]);

  useEffect(() => {
    if (isOpen && result) {
      hashValue(result.identifier || "").then((hash) => {
        setPrivacyFingerprint(hash);
      });
    } else {
      setPrivacyFingerprint("");
    }
  }, [isOpen, result]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("modalStateChange", {
        detail: { isModalOpen: isOpen }
      })
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("modalStateChange", {
          detail: { isModalOpen: false }
        })
      );
    };
  }, [isOpen]);

  const validateInput = useCallback((type, value) => {
    const trimmed = value.trim();
    if (!trimmed) return "Please enter a value to scan.";

    switch (type) {
      case "EMAIL":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? "" : "Invalid email format.";
      case "PHONE":
        return /^[6-9]\d{9}$/.test(trimmed) ? "" : "Invalid 10-digit Indian phone number.";
      case "IP":
        return /^((25[0-5]|2[0-4]\d|1?\d?\d)(\.|$)){4}$/.test(trimmed) ? "" : "Invalid IPv4 address.";
      case "AADHAAR":
        return /^\d{12}$/.test(trimmed) ? "" : "Aadhaar must be 12 digits.";
      case "PAN":
        return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(trimmed.toUpperCase()) ? "" : "Invalid PAN format.";
      case "URL":
        try {
          new URL(trimmed);
          return "";
        } catch {
          return "Invalid URL format.";
        }
      default:
        return "";
    }
  }, []);

  const handleScan = useCallback(async () => {
    const nextError = validateInput(selectedType, identifier);
    setError(nextError);
    if (nextError) return;

    const scannedIdentifier = identifier.trim();

    setLoading(true);
    setScanning(0);
    
    try {
      const scanInterval = setInterval(() => {
        setScanning(prev => (prev >= 95 ? 95 : prev + Math.random() * 40));
      }, 200);

      const response = await fetch(`${API}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          identifier: scannedIdentifier,
          localMode: useLocalDb
        })
      });

      clearInterval(scanInterval);

      if (!response.ok) {
        throw new Error("Scan failed");
      }

      const data = await response.json();
      const scanResult = data?.result || data?.attack || data?.data || data;

      if (scanResult && typeof scanResult === "object") {
        const nextResult = {
          ...scanResult,
          type: (scanResult.type || selectedType).toUpperCase(),
          identifier: scanResult.identifier || scannedIdentifier,
          status: scanResult.status || (scanResult.exposed ? "EXPOSED" : "SAFE"),
          risk: Number(scanResult.risk ?? scanResult.severityScore ?? 50),
          source: scanResult.source || (useLocalDb ? "Local SQLite" : "Live API"),
          breachName: scanResult.breachName || "Scan Complete",
          compromisedData: Array.isArray(scanResult.compromisedData) 
            ? scanResult.compromisedData 
            : scanResult.compromisedData ? [scanResult.compromisedData] : ["No confirmed compromise"],
          updatedAt: scanResult.updatedAt || scanResult.scanDate || new Date().toISOString()
        };

        setResult(nextResult);
        setScanning(100);
        setIsOpen(true);
        setIdentifier("");

        // Save to dashboard if logged in
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (user?.email) {
          const historyKey = `search_history_${user.email}`;
          const existing = JSON.parse(localStorage.getItem(historyKey) || "[]");
          existing.unshift({ ...nextResult, timestamp: new Date().toISOString() });
          localStorage.setItem(historyKey, JSON.stringify(existing.slice(0, 50)));
        }
      }
    } catch (err) {
      console.error("Scan error:", err);
      setScanning(0);
      setError("Scan failed. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setScanning(0), 300);
    }
  }, [identifier, selectedType, useLocalDb, validateInput]);

  const bgClass = dark
    ? "min-h-screen bg-slate-950 text-white"
    : "min-h-screen bg-gradient-to-b from-white via-sky-50 to-white text-slate-900";

  const cardClass = dark
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const inputClass = dark
    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400";

  return (
    <main className={`${bgClass} relative h-[calc(100vh-6.5rem)] overflow-hidden px-4 pt-5 pb-3 sm:px-6 lg:px-8 flex flex-col`}>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${dark ? "opacity-100" : "opacity-80"}`}
      >
        <div className={`absolute inset-0 ${dark ? "bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%),linear-gradient(rgba(148,163,184,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.09)_1px,transparent_1px)]" : "bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_30%),linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)]"} bg-[size:100%_100%,100%_100%,26px_26px,26px_26px]`} />
      </div>
      {/* Gradient orbs */}
      {dark && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-blue-900/20 blur-3xl" />
          <div className="absolute right-[-8rem] top-32 h-80 w-80 rounded-full bg-cyan-900/15 blur-3xl" />
        </div>
      )}

      <section className="relative mx-auto w-full max-w-3xl text-center flex-1 flex flex-col overflow-hidden">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <h1 className="text-4xl sm:text-5xl font-black mb-3 tracking-[0.16em] bg-[linear-gradient(to_right,#ff8a00,#e5b061,#72aeb6,#0ea5e9)] bg-clip-text text-transparent">
            Cyber Attack Visualizer
          </h1>
          <p className={`text-xl sm:text-2xl font-extrabold ${dark ? "text-sky-300" : "text-sky-700"}`}>
            Have I Been Breached?
          </p>
          <p className={`mt-2 text-sm sm:text-base ${dark ? "text-slate-300" : "text-slate-600"} max-w-2xl mx-auto`}>
            Check if your email, phone, Aadhaar, PAN, IP or URL has been exposed in a data breach.
          </p>
        </motion.div>

        {/* Scan Types */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 flex flex-wrap justify-center gap-2"
        >
          {SCAN_TYPES.map((type) => {
            const active = selectedType === type;
            const Icon = TYPE_META[type].icon;
            return (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type);
                  setError("");
                  setIdentifier("");
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all ${
                  active
                    ? dark
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50"
                      : "bg-sky-500 text-white shadow-lg shadow-sky-400/50"
                    : dark
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Icon size={16} />
                {TYPE_META[type].label}
              </button>
            );
          })}
        </motion.div>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={`${cardClass} border rounded-2xl p-5 sm:p-6 shadow-xl mb-8`}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(normalizeInputByType(selectedType, e.target.value))}
              onKeyPress={(e) => e.key === "Enter" && !loading && handleScan()}
              placeholder={TYPE_META[selectedType].placeholder}
              disabled={loading}
              maxLength={maxLengthByType(selectedType)}
              className={`flex-1 px-5 py-4 rounded-xl border outline-none transition ${inputClass} ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
            <button
              onClick={handleScan}
              disabled={loading}
              className={`px-8 py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${
                dark
                  ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-700"
                  : "bg-sky-500 hover:bg-sky-600 text-white disabled:bg-slate-400"
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Check
                </>
              )}
            </button>
          </div>

          {/* Progress bar */}
          {loading && scanning > 0 && (
            <div className={`mt-4 h-1 rounded-full overflow-hidden ${dark ? "bg-slate-800" : "bg-slate-200"}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${scanning}%` }}
                className={`h-full ${dark ? "bg-blue-500" : "bg-sky-500"}`}
              />
            </div>
          )}

          {error && (
            <div className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium ${
              dark ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-700"
            }`}>
              {error}
            </div>
          )}

          {/* Mode Toggle */}
          <div className={`mt-6 pt-6 border-t ${dark ? "border-slate-700" : "border-slate-200"} flex items-center gap-3`}>
            <button
              onClick={() => setUseLocalDb(!useLocalDb)}
              disabled={(selectedType === "AADHAAR" || selectedType === "PAN")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition ${
                useLocalDb
                  ? dark
                    ? "bg-emerald-900/50 text-emerald-300"
                    : "bg-emerald-100 text-emerald-700"
                  : dark
                    ? "bg-slate-800 text-slate-400"
                    : "bg-slate-100 text-slate-600"
              } ${(selectedType === "AADHAAR" || selectedType === "PAN") ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Database size={16} />
              {useLocalDb ? "Local DB" : "Live API"}
            </button>
            <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
              {selectedType === "AADHAAR" || selectedType === "PAN"
                ? "Local DB required for Aadhaar & PAN"
                : useLocalDb ? "Using offline database" : "Using live lookup"}
            </span>
          </div>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-3 gap-3 sm:gap-4 text-center"
        >
          {[
            { label: "6 Scan Types", note: "Email, Phone, IP, Aadhaar, PAN, URL" },
            { label: "Offline Ready", note: "SQLite-backed local database" },
            { label: "Instant Results", note: "Real-time breach detection" }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`${cardClass} border rounded-xl p-3 sm:p-4`}
            >
              <p className={`font-bold text-sm sm:text-base ${dark ? "text-white" : "text-slate-900"}`}>
                {item.label}
              </p>
              <p className={`text-xs mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {item.note}
              </p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Result Modal */}
      <AnimatePresence>
        {isOpen && result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-4 backdrop-blur-sm sm:p-6">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`${cardClass} border w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden relative max-h-[94vh] flex flex-col`}
            >
              <button
                onClick={() => setIsOpen(false)}
                className={`absolute right-4 top-4 z-20 rounded-full p-2 transition ${
                  dark ? "bg-slate-800/90 text-slate-200 hover:bg-slate-700" : "bg-white/90 text-slate-700 hover:bg-slate-100"
                } shadow-lg`}
                aria-label="Close result"
              >
                ✕
              </button>

              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`px-5 py-4 pr-16 ${dark ? "bg-gradient-to-r from-slate-800 to-slate-900" : "bg-gradient-to-r from-slate-900 to-slate-800"} text-white`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-75">Scan Result</p>
                    <h2 className="text-xl sm:text-2xl font-black mt-1">{maskValue(result.identifier)}</h2>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm opacity-90">
                  <span>{TYPE_META[result.type]?.label}</span>
                  <span>•</span>
                  <span>{result.source}</span>
                  <span>•</span>
                  <span>Privacy hash: {privacyFingerprint || "…"}</span>
                </div>
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-h-0 p-4 sm:p-5 space-y-4 sm:space-y-5 pt-6 sm:pt-6 overflow-y-auto">
                {/* Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Status", value: result.status, tone: result.status === "EXPOSED" ? "red" : "green", icon: result.status === "EXPOSED" ? ShieldAlert : BadgeCheck },
                    { label: "Risk Score", value: `${Math.min(100, result.risk)}/100`, tone: result.risk > 70 ? "red" : result.risk > 40 ? "amber" : "green", icon: AlertTriangle },
                    { label: "Source", value: result.source || "Unknown", tone: "blue", icon: FileSearch },
                    { label: "Checked At", value: formatDate(result.updatedAt || result.scanDate), tone: "slate", icon: Clock3 }
                  ].map((item) => {
                    const ToneIcon = item.icon;
                    const toneClass = {
                      red: dark ? "bg-red-950/40 text-red-300 border-red-900/60" : "bg-red-50 text-red-700 border-red-200",
                      amber: dark ? "bg-amber-950/40 text-amber-300 border-amber-900/60" : "bg-amber-50 text-amber-700 border-amber-200",
                      green: dark ? "bg-emerald-950/40 text-emerald-300 border-emerald-900/60" : "bg-emerald-50 text-emerald-700 border-emerald-200",
                      blue: dark ? "bg-sky-950/40 text-sky-300 border-sky-900/60" : "bg-sky-50 text-sky-700 border-sky-200",
                      slate: dark ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-slate-100 text-slate-700 border-slate-200"
                    }[item.tone];

                    return (
                      <div key={item.label} className={`border rounded-2xl p-4 ${toneClass}`}>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <p className="text-xs font-bold uppercase tracking-wider opacity-80">{item.label}</p>
                          <ToneIcon size={16} />
                        </div>
                        <p className="text-base sm:text-lg font-black leading-tight break-words">{item.value}</p>
                      </div>
                    );
                  })}
                </div>

                <div className={`h-2 rounded-full overflow-hidden ${dark ? "bg-slate-800" : "bg-slate-200"}`}>
                  <div
                    className={`h-full rounded-full transition-all ${result.risk > 70 ? "bg-red-500" : result.risk > 40 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, result.risk)}%` }}
                  />
                </div>

                {/* Breach Details */}
                <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className={`${dark ? "bg-slate-900/70" : "bg-slate-50"} border ${dark ? "border-slate-700" : "border-slate-200"} rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4`}>
                    <div className="flex items-center gap-2">
                      <Shield size={18} className="text-sky-500" />
                      <p className="font-black">Exposure Summary</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>Breach Record</p>
                        <p className={`mt-1.5 font-semibold break-words ${dark ? "text-slate-100" : "text-slate-900"}`}>{result.breachName || "Unknown"}</p>
                      </div>
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>Breach Date</p>
                        <p className={`mt-1.5 font-semibold ${dark ? "text-slate-100" : "text-slate-900"}`}>{result.breachDate || "Unknown"}</p>
                      </div>
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>Identifier Fingerprint</p>
                        <p className={`mt-1.5 font-mono text-xs sm:text-sm break-all ${dark ? "text-slate-200" : "text-slate-700"}`}>{privacyFingerprint ? `sha256:${privacyFingerprint}` : "Generating..."}</p>
                      </div>
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>Privacy Mask</p>
                        <p className={`mt-1.5 font-mono text-xs sm:text-sm break-all ${dark ? "text-slate-200" : "text-slate-700"}`}>{maskValue(result.identifier)}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`${dark ? "bg-slate-900/70" : "bg-slate-50"} border ${dark ? "border-slate-700" : "border-slate-200"} rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4`}>
                    <div className="flex items-center gap-2">
                      <Fingerprint size={18} className="text-cyan-500" />
                      <p className="font-black">Compromised Data</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(result.compromisedData || []).map((item) => (
                        <span
                          key={item}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                            dark
                              ? "bg-slate-800 text-slate-200 border border-slate-700"
                              : "bg-white text-slate-700 border border-slate-200"
                          }`}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`${dark ? "bg-slate-900/70" : "bg-slate-50"} border ${dark ? "border-slate-700" : "border-slate-200"} rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" />
                    <p className="font-black">Recommended Actions</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {PreventionItems.map((item, index) => (
                      <div
                        key={item}
                        className={`rounded-xl p-3.5 border ${
                          dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${dark ? "bg-sky-900 text-sky-300" : "bg-sky-100 text-sky-700"}`}>
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <p className={`text-sm leading-6 ${dark ? "text-slate-200" : "text-slate-700"}`}>{item}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`grid gap-3 text-sm sm:grid-cols-3 ${dark ? "text-slate-300" : "text-slate-600"}`}>
                  <div className={`rounded-xl p-3.5 border ${dark ? "border-slate-700 bg-slate-900/60" : "border-slate-200 bg-white"}`}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Scan Type</p>
                    <p className="font-semibold">{TYPE_META[result.type]?.label || result.type}</p>
                  </div>
                  <div className={`rounded-xl p-3.5 border ${dark ? "border-slate-700 bg-slate-900/60" : "border-slate-200 bg-white"}`}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Mode</p>
                    <p className="font-semibold">{useLocalDb ? "Local Database" : "Live Lookup"}</p>
                  </div>
                  <div className={`rounded-xl p-3.5 border ${dark ? "border-slate-700 bg-slate-900/60" : "border-slate-200 bg-white"}`}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Reference</p>
                    <p className="font-semibold break-all">{privacyFingerprint ? `#${privacyFingerprint.slice(0, 10)}` : "Pending"}</p>
                  </div>
                </div>

                <div className={`rounded-2xl p-4 sm:p-5 border ${dark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-slate-50"}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>Security Guidance</p>
                  <p className={`mt-2 text-sm leading-6 ${dark ? "text-slate-300" : "text-slate-600"}`}>
                    {result.status === "EXPOSED"
                      ? "Treat this as an active exposure. Rotate credentials, check recovery channels, and review financial or government-linked services tied to this identifier."
                      : "Keep your identity hygiene strong: use unique passwords, enable MFA, and avoid reusing the same credential across services."}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      {!isOpen && (
      <footer className="relative mt-auto shrink-0 pt-2">
        <div className="mx-auto max-w-5xl px-1 sm:px-2">
          <div className={`rounded-full border px-4 py-2.5 ${dark ? "bg-slate-950/90 text-slate-400 border-slate-800" : "bg-white/90 text-slate-600 border-slate-200"} backdrop-blur-md`}>
            <div className="flex flex-col items-center justify-center gap-1 text-center">
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] font-semibold sm:text-[11px]">
                <span>DPDP Act 2023 Aligned Privacy Workflow</span>
                <span className="opacity-50">•</span>
                <span>SHA-256 Identifier Fingerprinting</span>
              </div>

              <div className={`text-[9px] sm:text-[10px] ${dark ? "text-slate-500" : "text-slate-500"}`}>
                Developed by Fardeen Akmal, Sushil Nirmal, Jigisha Naidu, and Suvajit Ghosh
              </div>
            </div>
          </div>
        </div>
      </footer>
      )}
    </main>
  );
}

export default Home;
