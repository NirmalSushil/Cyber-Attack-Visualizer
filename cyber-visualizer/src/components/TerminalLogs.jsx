import React, { useEffect, useState } from "react";

const sampleLogs = [
  "Brute force attempt detected from 185.23.44.12",
  "Malware payload blocked",
  "Suspicious login attempt detected",
  "Firewall rule applied",
  "DDoS mitigation activated",
  "IP address blacklisted",
  "Phishing domain detected",
  "Port scanning activity detected"
];

export default function TerminalLogs() {

  const [logs, setLogs] = useState([]);

  useEffect(() => {

    const interval = setInterval(() => {

      const newLog =
        sampleLogs[Math.floor(Math.random() * sampleLogs.length)];

      const time = new Date().toLocaleTimeString();

      setLogs(prev => [
        `[${time}] ${newLog}`,
        ...prev.slice(0, 8)
      ]);

    }, 2500);

    return () => clearInterval(interval);

  }, []);

  return (

    <div className="bg-black rounded-xl p-4 font-mono text-green-400 text-sm">

      <h3 className="text-green-300 mb-3">
        Live Intrusion Logs
      </h3>

      <div className="space-y-1">

        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}

      </div>

    </div>

  );

}
