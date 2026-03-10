import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Smartphone,
  Shield,
  CreditCard,
  Wifi,
  Link
} from "lucide-react";

const HomePage = () => {

  const [mode, setMode] = useState("API");
  const [identifier, setIdentifier] = useState("");
  const [type, setType] = useState("EMAIL");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const scanCards = [
    { title: "EMAIL SCAN", desc: "Checks whether an email appears in known data breaches.", icon: <Mail size={26}/> },
    { title: "PHONE SCAN", desc: "Checks if a phone number exists in spam lists or leak datasets.", icon: <Smartphone size={26}/> },
    { title: "AADHAAR SCAN", desc: "Checks Aadhaar numbers in local breach datasets.", icon: <Shield size={26}/> },
    { title: "PAN SCAN", desc: "Checks PAN numbers in financial leak datasets.", icon: <CreditCard size={26}/> },
    { title: "IP SCAN", desc: "Analyzes IP reputation and malicious activity.", icon: <Wifi size={26}/> },
    { title: "URL ANALYSIS", desc: "Detects phishing websites and malicious domains.", icon: <Link size={26}/> }
  ];

  const isValidAadhaar = (aadhaar) => /^[0-9]{12}$/.test(aadhaar);
  const isValidPAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);

  useEffect(() => {
    if (type === "AADHAAR" || type === "PAN") {
      setMode("LOCAL");
    }
  }, [type]);

  const handleSearch = async () => {

    if (!identifier) return;

    if (type === "PAN" && !isValidPAN(identifier.toUpperCase())) {
      alert("Invalid PAN format. Example: ABCDE1234F");
      return;
    }

    if (type === "AADHAAR" && !isValidAadhaar(identifier)) {
      alert("Aadhaar must be 12 digits");
      return;
    }

    setLoading(true);
    setResult(null);

    try {

      let response;
      let data;

      if (mode === "API") {

        response = await fetch("http://localhost:5000/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, type })
        });

        data = await response.json();
        setResult(data);

      } else {

        response = await fetch(
          `http://localhost:5000/api/attacks/search?query=${identifier}`
        );

        data = await response.json();

        if (data.length === 0) {
          setResult({ status: "Safe" });
        } else {
          setResult({
            status: "Exposed",
            records: data
          });
        }

      }

    } catch (error) {
      console.error("Scan failed:", error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white px-6 py-14">
      <div className="max-w-7xl mx-auto">

        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-10">

          <div className="text-center mb-14">
            <h1 className="text-4xl font-bold tracking-wider">
              CYBER ATTACK VISUALIZER
            </h1>
            <p className="text-slate-400 mt-3">
              Real-time breach detection system for exposed personal data
            </p>
          </div>

          {/* MODE SWITCH */}
          <div className="flex justify-center mb-10">

            <div className="relative w-60 h-12 bg-slate-800 rounded-full p-1">

              <motion.div
                layout
                className={`absolute top-1 bottom-1 w-1/2 rounded-full ${
                  mode === "API"
                    ? "left-1 bg-gradient-to-r from-emerald-500 to-cyan-500"
                    : "left-1/2 bg-gradient-to-r from-cyan-500 to-blue-500"
                }`}
              />

              <button
                onClick={() => setMode("API")}
                className="relative z-10 w-1/2 h-full font-semibold"
              >
                API
              </button>

              <button
                onClick={() => setMode("LOCAL")}
                className="relative z-10 w-1/2 h-full font-semibold"
              >
                LOCAL
              </button>

            </div>

          </div>

          {/* SEARCH */}
          <div className="flex gap-4 mb-12">

            <input
              value={identifier}
              onChange={(e)=>setIdentifier(e.target.value)}
              placeholder="Enter email, phone, IP, URL..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-6 py-3"
            />

            <select
              value={type}
              onChange={(e)=>setType(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-xl px-4"
            >
              <option value="EMAIL">Email</option>
              <option value="PHONE">Phone</option>
              <option value="IP">IP</option>
              <option value="URL">URL</option>
              <option value="AADHAAR">Aadhaar</option>
              <option value="PAN">PAN</option>
            </select>

            <button
              onClick={handleSearch}
              className="px-8 py-3 rounded-full font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 text-black"
            >
              {loading ? "Scanning..." : "Run Scan"}
            </button>

          </div>

          {/* RESULT */}
          <AnimatePresence>

            {result?.status === "Safe" && (
              <div className="bg-emerald-900/20 p-8 rounded-2xl border border-emerald-500 text-center">
                <h2 className="text-3xl font-bold text-emerald-400">
                  No Exposure Found
                </h2>
              </div>
            )}

            {result?.status === "Exposed" && (

              <div className="bg-red-900/20 p-8 rounded-2xl border border-red-500">

                <h2 className="text-2xl font-bold text-red-400 mb-4">
                  Data Exposure Detected
                </h2>

                {/* API MODE */}
                {!result.records && (

                  <div className="space-y-2 text-sm">

                    <p><b>Source:</b> {result.source}</p>
                    <p><b>Severity Score:</b> {result.severityScore}</p>
                    <p><b>Breach:</b> {result.breachName || "Unknown Breach"}</p>
                    <p><b>Breach Year:</b> {result.breachDate || "Unknown"}</p>
                    <p><b>Compromised Data:</b> {result.compromisedData || "Unknown"}</p>

                  </div>

                )}

                {/* LOCAL MODE */}
                {result.records && result.records.map((r,i)=>(
                  <div key={i} className="border-t border-red-800 pt-3 mt-3 text-sm">

                    <p><b>Source:</b> {r.source}</p>
                    <p><b>Breach:</b> {r.breachName}</p>
                    <p><b>Breach Year:</b> {r.breachDate}</p>
                    <p><b>Compromised Data:</b> {r.compromisedData}</p>

                  </div>
                ))}

              </div>

            )}

          </AnimatePresence>

          {/* SCAN TYPES */}
          <div className="grid md:grid-cols-3 gap-6 mt-14">

            {scanCards.map((card,i)=>(
              <div key={i} className="bg-slate-800 border border-slate-700 p-6 rounded-xl">

                <div className="flex items-center gap-3 mb-3 text-cyan-400">
                  {card.icon}
                  <h3 className="font-semibold">{card.title}</h3>
                </div>

                <p className="text-sm text-slate-400">
                  {card.desc}
                </p>

              </div>
            ))}

          </div>

        </div>

      </div>
    </div>
  );
};

export default HomePage;
