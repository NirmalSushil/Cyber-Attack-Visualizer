const axios = require('axios');
const Attack = require('../models/Attack');

const API_KEYS = {
    LEAKCHECK: process.env.LEAKCHECK_API_KEY,
    ABUSEIPDB: process.env.ABUSEIPDB_KEY,
    VIRUSTOTAL: process.env.VIRUSTOTAL_API_KEY,
    NUMVERIFY: process.env.NUMVERIFY_API_KEY 
};

// Database Logging Helper
const logToDatabase = async (scanResult) => {
    try {
        await Attack.create({
            identifier: scanResult.identifier,
            type: scanResult.type,
            status: scanResult.status,
            severityScore: scanResult.severityScore,
            source: scanResult.source,
            breachName: scanResult.breachName,
            breachDate: scanResult.breachDate,
            compromisedData: scanResult.compromisedData,
            scanDate: new Date()
        });
    } catch (err) {
        console.error("Database Logging Failed:", err.message);
    }
};

// ================= PERFORM SCAN =================

exports.performScan = async (req, res) => {
    const { identifier, type } = req.body;

    if (!identifier || !type) {
        return res.status(400).json({ error: "Missing identifier or type" });
    }

    try {
        // 1. ================= EMAIL SCAN (LeakCheck) =================
        if (type === "EMAIL") {
            try {
                const response = await axios.get(
                    `https://leakcheck.io/api/public?check=${identifier}&type=email`,
                    { headers: { "X-API-Key": API_KEYS.LEAKCHECK } }
                );
                
                if (response.data.success && response.data.found > 0) {
                    const result = {
                        status: "Exposed",
                        identifier,
                        type,
                        severityScore: 95,
                        source: "LeakCheck",
                        breachName: response.data.sources[0]?.name || "Multiple Breaches Detected",
                        breachDate: response.data.sources[0]?.date || "Various",
                        compromisedData: "Email, Password, Personal Info"
                    };
                    await logToDatabase(result);
                    return res.json(result);
                }
            } catch (err) {
                console.error("LeakCheck error:", err.message);
            }

            const result = { status: "Safe", identifier, type };
            await logToDatabase(result);
            return res.json(result);
        }

        // 2. ================= IP SCAN (AbuseIPDB) =================
        if (type === "IP") {
            try {
                const response = await axios.get("https://api.abuseipdb.com/api/v2/check", {
                    params: { ipAddress: identifier, maxAgeInDays: 90 },
                    headers: { Key: API_KEYS.ABUSEIPDB, Accept: "application/json" }
                });
                
                const data = response.data.data;
                const risk = data.abuseConfidenceScore;

                if (risk > 0) {
                    const result = {
                        status: "Exposed",
                        identifier,
                        type,
                        severityScore: risk,
                        source: "AbuseIPDB",
                        breachName: `ISP: ${data.isp}`,
                        breachDate: new Date().toISOString().split('T')[0],
                        compromisedData: `Domain: ${data.domain || "Unknown"}, Usage: ${data.usageType || "Unknown"}`
                    };
                    await logToDatabase(result);
                    return res.json(result);
                }
            } catch (err) {
                console.error("AbuseIPDB error:", err.message);
            }

            const result = { status: "Safe", identifier, type };
            await logToDatabase(result);
            return res.json(result);
        }

        // 3. ================= URL SCAN (VirusTotal) =================
        if (type === "URL") {
            try {
                // VirusTotal requires URLs to be Base64url encoded
                const encodedUrl = Buffer.from(identifier).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
                
                const response = await axios.get(`https://www.virustotal.com/api/v3/urls/${encodedUrl}`, {
                    headers: { "x-apikey": API_KEYS.VIRUSTOTAL }
                });

                const stats = response.data.data.attributes.last_analysis_stats;
                const maliciousCount = stats.malicious || 0;
                const suspiciousCount = stats.suspicious || 0;
                
                const riskScore = Math.min((maliciousCount * 15) + (suspiciousCount * 5), 100);

                if (maliciousCount > 0 || suspiciousCount > 0) {
                    const result = {
                        status: "Exposed",
                        identifier,
                        type,
                        severityScore: riskScore,
                        source: "VirusTotal",
                        breachName: "Malicious Domain Detected",
                        breachDate: new Date().toISOString().split('T')[0],
                        compromisedData: `Flagged by ${maliciousCount} security engines`
                    };
                    await logToDatabase(result);
                    return res.json(result);
                }
            } catch (err) {
                console.error("VirusTotal Error:", err.response ? err.response.data : err.message);
                if (err.response && err.response.status === 404) {
                    const result = { status: "Safe", identifier, type, severityScore: 0, source: "VirusTotal (Unscanned)", breachName: "None", breachDate: "-", compromisedData: "None" };
                    await logToDatabase(result);
                    return res.json(result);
                }
            }

            const result = { status: "Safe", identifier, type };
            await logToDatabase(result);
            return res.json(result);
        }

        // 4. ================= PHONE SCAN (Numverify OSINT) =================
        if (type === "PHONE") {
            try {
                const response = await axios.get('http://apilayer.net/api/validate', {
                    params: {
                        access_key: API_KEYS.NUMVERIFY,
                        number: identifier,
                        country_code: 'IN' 
                    }
                });

                const data = response.data;

                if (data.valid) {
                    const result = {
                        status: "Exposed",
                        identifier,
                        type,
                        severityScore: data.line_type === 'mobile' ? 65 : 40,
                        source: "Numverify OSINT",
                        breachName: `Carrier: ${data.carrier || "Unknown Telecom"}`,
                        breachDate: new Date().toISOString().split('T')[0],
                        compromisedData: `Location: ${data.location || data.country_name}, Type: ${data.line_type || "Unknown"}`
                    };
                    await logToDatabase(result);
                    return res.json(result);
                }
            } catch (err) {
                console.error("Numverify Error:", err.message);
            }

            const result = { status: "Safe", identifier, type };
            await logToDatabase(result);
            return res.json(result);
        }

        // 5. ================= LOCAL SIMULATION (Fallback for AADHAAR/PAN) =================
        const result = {
            status: "Exposed",
            identifier,
            type,
            severityScore: 80,
            source: "Local Breach Dataset",
            breachName: "Local Data Leak",
            breachDate: "2023",
            compromisedData: "Personal Information"
        };

        await logToDatabase(result);
        return res.json(result);

    } catch (error) {
        console.error("Master Scan Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ================= GET ALL =================
exports.getAllAttacks = async (req, res) => {
    try {
        const attacks = await Attack.getAll();
        res.json(attacks);
    } catch {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ================= SEARCH =================
exports.searchAttacks = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ error: "Query required" });

        const results = await Attack.search(query);
        res.json(results);
    } catch {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ================= DELETE =================
exports.deleteAttack = async (req, res) => {
    try {
        const { id } = req.params;
        await Attack.deleteById(id);
        res.json({ message: "Record deleted" });
    } catch {
        res.status(500).json({ error: "Failed to delete record" });
    }
};
