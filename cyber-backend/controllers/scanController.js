const axios = require('axios');
const Attack = require('../models/Attack');
const db = require('../config/db'); 

const API_KEYS = {
    LEAKCHECK: process.env.LEAKCHECK_API_KEY,
    ABUSEIPDB: process.env.ABUSEIPDB_KEY || process.env.ABUSEIPDB_API_KEY,
    VIRUSTOTAL: process.env.VIRUSTOTAL_API_KEY,
    NUMVERIFY: process.env.NUMVERIFY_API_KEY || process.env.NUMVERIFY_KEY
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

const normalizeIdentifier = (value, type) => {
    const raw = String(value || '').trim();
    if (type === 'PAN') return raw.toUpperCase();
    if (type === 'PHONE') return raw.replace(/\D/g, '');
    if (type === 'AADHAAR') return raw.replace(/\D/g, '');
    return raw;
};

const isSameIdentifier = (a, b, type) => {
    if (type === 'AADHAAR') {
        return normalizeIdentifier(a, type) === normalizeIdentifier(b, type);
    }

    if (type === 'PHONE' || type === 'PAN') {
        return normalizeIdentifier(a, type) === normalizeIdentifier(b, type);
    }

    return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
};

const getLocalFallbackResult = async (identifier, type, reason) => {
    const latest = await Attack.search(identifier);
    const sameType = (latest || []).filter((record) =>
        (record.type || '').toUpperCase() === type && isSameIdentifier(record.identifier, identifier, type)
    );

    if (sameType.length > 0) {
        const localMatch = sameType[0];
        return {
            status: localMatch.status || 'Safe',
            identifier,
            type,
            severityScore: Number(localMatch.severityScore || 0),
            source: `Local DB Fallback (${reason})`,
            breachName: localMatch.breachName || 'Local Dataset Match',
            breachDate: localMatch.breachDate || '-',
            compromisedData: localMatch.compromisedData || 'Local archived data',
            fallbackMode: true
        };
    }

    return {
        status: 'Safe',
        identifier,
        type,
        severityScore: 0,
        source: `Local DB Fallback (${reason})`,
        breachName: 'No local match found',
        breachDate: '-',
        compromisedData: 'None',
        fallbackMode: true
    };
};

// ================= PERFORM SCAN =================
exports.performScan = async (req, res) => {
    const { identifier, type } = req.body;
    if (!identifier || !type) return res.status(400).json({ error: "Missing identifier or type" });

    const normalizedType = String(type).toUpperCase();
    const normalizedIdentifier = normalizeIdentifier(identifier, normalizedType);

    try {
        if (normalizedType === "EMAIL") {
            if (!API_KEYS.LEAKCHECK) {
                const fallback = await getLocalFallbackResult(normalizedIdentifier, normalizedType, 'LeakCheck key missing');
                await logToDatabase(fallback);
                return res.json(fallback);
            }

            try {
                const response = await axios.get(`https://leakcheck.io/api/public?check=${normalizedIdentifier}&type=email`, { headers: { "X-API-Key": API_KEYS.LEAKCHECK } });
                if (response.data.success && response.data.found > 0) {
                    const result = { status: "Exposed", identifier: normalizedIdentifier, type: normalizedType, severityScore: 95, source: "LeakCheck", breachName: response.data.sources[0]?.name || "Multiple Breaches Detected", breachDate: response.data.sources[0]?.date || "Various", compromisedData: "Email, Password, Personal Info" };
                    await logToDatabase(result);
                    return res.json(result);
                }
            } catch (err) {
                console.error("LeakCheck error:", err.message);
                const fallback = await getLocalFallbackResult(normalizedIdentifier, normalizedType, 'LeakCheck unavailable');
                await logToDatabase(fallback);
                return res.json(fallback);
            }

            const result = { status: "Safe", identifier: normalizedIdentifier, type: normalizedType };
            await logToDatabase(result);
            return res.json(result);
        }

        if (normalizedType === "IP") {
            if (!API_KEYS.ABUSEIPDB) {
                const fallback = await getLocalFallbackResult(normalizedIdentifier, normalizedType, 'AbuseIPDB key missing');
                await logToDatabase(fallback);
                return res.json(fallback);
            }

            try {
                const response = await axios.get("https://api.abuseipdb.com/api/v2/check", { params: { ipAddress: normalizedIdentifier, maxAgeInDays: 90 }, headers: { Key: API_KEYS.ABUSEIPDB, Accept: "application/json" } });
                const data = response.data.data;
                if (data.abuseConfidenceScore > 0) {
                    const result = { status: "Exposed", identifier: normalizedIdentifier, type: normalizedType, severityScore: data.abuseConfidenceScore, source: "AbuseIPDB", breachName: `ISP: ${data.isp}`, breachDate: new Date().toISOString().split('T')[0], compromisedData: `Domain: ${data.domain || "Unknown"}, Usage: ${data.usageType || "Unknown"}` };
                    await logToDatabase(result);
                    return res.json(result);
                }
            } catch (err) {
                console.error("AbuseIPDB error:", err.message);
                const fallback = await getLocalFallbackResult(normalizedIdentifier, normalizedType, 'AbuseIPDB unavailable');
                await logToDatabase(fallback);
                return res.json(fallback);
            }

            const result = { status: "Safe", identifier: normalizedIdentifier, type: normalizedType };
            await logToDatabase(result);
            return res.json(result);
        }

        if (normalizedType === "URL") {
            if (!API_KEYS.VIRUSTOTAL) {
                const fallback = await getLocalFallbackResult(normalizedIdentifier, normalizedType, 'VirusTotal key missing');
                await logToDatabase(fallback);
                return res.json(fallback);
            }

            try {
                const encodedUrl = Buffer.from(normalizedIdentifier).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
                const response = await axios.get(`https://www.virustotal.com/api/v3/urls/${encodedUrl}`, { headers: { "x-apikey": API_KEYS.VIRUSTOTAL } });
                const stats = response.data.data.attributes.last_analysis_stats;
                const maliciousCount = stats.malicious || 0;
                const suspiciousCount = stats.suspicious || 0;
                const riskScore = Math.min((maliciousCount * 15) + (suspiciousCount * 5), 100);

                if (maliciousCount > 0 || suspiciousCount > 0) {
                    const result = { status: "Exposed", identifier: normalizedIdentifier, type: normalizedType, severityScore: riskScore, source: "VirusTotal", breachName: "Malicious Domain Detected", breachDate: new Date().toISOString().split('T')[0], compromisedData: `Flagged by ${maliciousCount} security engines` };
                    await logToDatabase(result);
                    return res.json(result);
                }
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    const result = { status: "Safe", identifier: normalizedIdentifier, type: normalizedType, severityScore: 0, source: "VirusTotal (Unscanned)", breachName: "None", breachDate: "-", compromisedData: "None" };
                    await logToDatabase(result);
                    return res.json(result);
                }

                const fallback = await getLocalFallbackResult(normalizedIdentifier, normalizedType, 'VirusTotal unavailable');
                await logToDatabase(fallback);
                return res.json(fallback);
            }

            const result = { status: "Safe", identifier: normalizedIdentifier, type: normalizedType };
            await logToDatabase(result);
            return res.json(result);
        }

        if (normalizedType === "PHONE") {
            if (!API_KEYS.NUMVERIFY) {
                const fallback = await getLocalFallbackResult(normalizedIdentifier, normalizedType, 'Numverify key missing');
                await logToDatabase(fallback);
                return res.json(fallback);
            }

            try {
                const response = await axios.get('http://apilayer.net/api/validate', { params: { access_key: API_KEYS.NUMVERIFY, number: normalizedIdentifier, country_code: 'IN' } });
                const data = response.data;
                if (data.valid) {
                    const result = { status: "Exposed", identifier: normalizedIdentifier, type: normalizedType, severityScore: data.line_type === 'mobile' ? 65 : 40, source: "Numverify OSINT", breachName: `Carrier: ${data.carrier || "Unknown Telecom"}`, breachDate: new Date().toISOString().split('T')[0], compromisedData: `Location: ${data.location || data.country_name}, Type: ${data.line_type || "Unknown"}` };
                    await logToDatabase(result);
                    return res.json(result);
                }
            } catch (err) {
                console.error("Numverify Error:", err.message);
                const fallback = await getLocalFallbackResult(normalizedIdentifier, normalizedType, 'Numverify unavailable');
                await logToDatabase(fallback);
                return res.json(fallback);
            }

            const result = { status: "Safe", identifier: normalizedIdentifier, type: normalizedType };
            await logToDatabase(result);
            return res.json(result);
        }

        const fallback = await getLocalFallbackResult(normalizedIdentifier, normalizedType, 'No API for this type');
        const result = fallback.fallbackMode
            ? fallback
            : { status: "Exposed", identifier: normalizedIdentifier, type: normalizedType, severityScore: 80, source: "Local Breach Dataset", breachName: "Local Data Leak", breachDate: "2023", compromisedData: "Personal Information" };
        await logToDatabase(result);
        return res.json(result);

    } catch (error) {
        console.error("Master Scan Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ================= DATABASE CRUD =================
exports.getAllAttacks = async (req, res) => {
    try { const attacks = await Attack.getAll(); res.json(attacks); } 
    catch { res.status(500).json({ error: "Internal Server Error" }); }
};

exports.searchAttacks = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ error: "Query required" });
        const results = await Attack.search(query);
        res.json(results);
    } catch { res.status(500).json({ error: "Internal Server Error" }); }
};

exports.deleteAttack = async (req, res) => {
    try { await Attack.deleteById(req.params.id); res.json({ message: "Record deleted" }); } 
    catch { res.status(500).json({ error: "Failed to delete record" }); }
};

// ================= IP ENRICHMENT & CACHING =================
exports.enrichIp = async (req, res) => {
    const { ip } = req.params;
    if (!ip) return res.status(400).json({ error: "IP address required" });

    try {
        const cacheQuery = `SELECT * FROM threat_cache WHERE ip = ? AND cached_at >= datetime('now', '-1 day')`;
        const [cacheResults] = await db.execute(cacheQuery, [ip]);

        if (cacheResults && cacheResults.length > 0) {
            const cachedData = cacheResults[0];
            return res.json({ ip: cachedData.ip, confidenceScore: cachedData.confidenceScore, isp: cachedData.isp, vtStats: JSON.parse(cachedData.vtStats), source: "SQLite Cache ⚡" });
        }

        const abuseResponse = await axios.get("https://api.abuseipdb.com/api/v2/check", { params: { ipAddress: ip, maxAgeInDays: 90 }, headers: { Key: API_KEYS.ABUSEIPDB, Accept: "application/json" } });
        const vtResponse = await axios.get(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, { headers: { "x-apikey": API_KEYS.VIRUSTOTAL } });

        const confidenceScore = abuseResponse.data.data.abuseConfidenceScore || 0;
        const isp = abuseResponse.data.data.isp || "Unknown";
        const vtStats = vtResponse.data.data.attributes.last_analysis_stats || {};

        const insertQuery = `INSERT OR REPLACE INTO threat_cache (ip, confidenceScore, isp, vtStats, cached_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`;
        await db.execute(insertQuery, [ip, confidenceScore, isp, JSON.stringify(vtStats)]);

        return res.json({ ip, confidenceScore, isp, vtStats, source: "Live API 🌐" });
    } catch (error) {
        console.error("Enrichment Error:", error.message);
        res.status(500).json({ error: "Failed to enrich IP intelligence" });
    }
};

// ================= LIVE SANS ISC THREAT FEED =================
exports.getGlobalThreats = async (req, res) => {
    try {
        // Using SANS Internet Storm Center (Highly reliable, no strict rate-limiting)
        const response = await axios.get('https://isc.sans.edu/api/topips/records/15?json', { 
            timeout: 8000 
        });
        
        if (response.data && Array.isArray(response.data)) {
            const liveThreats = response.data.map(threat => {
                const reports = parseInt(threat.reports || 0);
                const isp = threat.asname ? threat.asname.substring(0, 20) : 'Unknown ISP';
                
                return {
                    id: threat.ip,
                    name: `Active Threat Node (${isp})`,
                    target: `Attacking IP: ${threat.ip}`,
                    sev: reports > 100000 ? 'CRITICAL' : reports > 50000 ? 'HIGH' : 'MEDIUM',
                    region: threat.name || 'Global',
                    time: threat.updated ? new Date(threat.updated).toISOString() : new Date().toISOString(),
                    icon: reports > 100000 ? "💀" : reports > 50000 ? "🔴" : "🟠"
                };
            });
            
            return res.json(liveThreats);
        }
        
        res.json([]);
    } catch (error) {
        console.error("SANS ISC API failed:", error.message);
        res.json([]);
    }
};
