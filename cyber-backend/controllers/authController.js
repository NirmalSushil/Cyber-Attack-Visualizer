const crypto = require("crypto");
const db = require("../config/db");

const GOV_ACCOUNT = {
  name: "Ministry of Cyber Security",
  username: "gov_admin",
  email: "gov.admin@cert-in.gov.in",
  govId: "GOV-CERT-001",
  password: "gov@secure123",
  role: "government",
  department: "CERT-In, MeitY",
  clearance: "TOP SECRET"
};

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeUsername(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeGovId(value) {
  return normalizeText(value).toUpperCase();
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password || "")).digest("hex");
}

function toUserPayload(row) {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    phone: row.phone,
    govId: row.govId,
    role: row.role,
    department: row.department,
    clearance: row.clearance,
    isGuest: false,
    createdAt: row.createdAt
  };
}

async function ensureGovAccount() {
  const govId = normalizeGovId(GOV_ACCOUNT.govId);
  const [rows] = await db.execute("SELECT id FROM users WHERE govId = ? LIMIT 1", [govId]);

  if (rows.length > 0) return;

  await db.execute(
    `INSERT INTO users
      (name, username, email, govId, passwordHash, role, department, clearance)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      GOV_ACCOUNT.name,
      normalizeUsername(GOV_ACCOUNT.username),
      normalizeEmail(GOV_ACCOUNT.email),
      govId,
      hashPassword(GOV_ACCOUNT.password),
      GOV_ACCOUNT.role,
      GOV_ACCOUNT.department,
      GOV_ACCOUNT.clearance
    ]
  );
}

exports.register = async (req, res) => {
  try {
    await ensureGovAccount();

    const name = normalizeText(req.body?.name);
    const username = normalizeUsername(req.body?.username);
    const email = normalizeEmail(req.body?.email);
    const phone = normalizeText(req.body?.phone);
    const password = String(req.body?.password || "").trim();

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "name, username, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const [existing] = await db.execute(
      "SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1",
      [email, username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "An account with this email or username already exists" });
    }

    const passwordHash = hashPassword(password);

    const [result] = await db.execute(
      `INSERT INTO users
       (name, username, email, phone, passwordHash, role, department, clearance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, username, email, phone || null, passwordHash, "Analyst", "Cyber Security", "STANDARD"]
    );

    const [rows] = await db.execute("SELECT * FROM users WHERE id = ? LIMIT 1", [result.insertId]);

    return res.status(201).json({
      message: "Account created successfully",
      user: toUserPayload(rows[0])
    });
  } catch (error) {
    console.error("Register error:", error.message);
    return res.status(500).json({ error: "Failed to register user" });
  }
};

exports.login = async (req, res) => {
  try {
    await ensureGovAccount();

    const mode = normalizeText(req.body?.mode).toLowerCase();
    const password = String(req.body?.password || "").trim();

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const passwordHash = hashPassword(password);

    if (mode === "government") {
      const govId = normalizeGovId(req.body?.govId);
      if (!govId) {
        return res.status(400).json({ error: "Government ID is required" });
      }

      const [rows] = await db.execute(
        `SELECT * FROM users
         WHERE govId = ? AND passwordHash = ? AND role = 'government'
         LIMIT 1`,
        [govId, passwordHash]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: "Invalid Government ID or password" });
      }

      return res.json({ user: toUserPayload(rows[0]) });
    }

    const loginId = normalizeText(req.body?.loginId).toLowerCase();
    if (!loginId) {
      return res.status(400).json({ error: "Email or username is required" });
    }

    const [rows] = await db.execute(
      `SELECT * FROM users
       WHERE (email = ? OR username = ?) AND passwordHash = ?
       LIMIT 1`,
      [loginId, loginId, passwordHash]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials. Check your email/username and password." });
    }

    return res.json({ user: toUserPayload(rows[0]) });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ error: "Failed to login" });
  }
};
