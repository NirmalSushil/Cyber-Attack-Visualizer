const USERS_DB_KEY = "ecebip_users_db";
const SESSION_KEY  = "ecebip_session";

function normalizeText(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function normalizePassword(value) {
  return (value ?? "").toString().trim();
}

export function getAllUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_DB_KEY) || "[]"); }
  catch { return []; }
}

export function saveUser(userData) {
  const users = getAllUsers();
  const normalizedUser = {
    ...userData,
    email: userData.email ? normalizeText(userData.email) : userData.email,
    username: userData.username ? normalizeText(userData.username) : userData.username,
    govId: userData.govId ? userData.govId.toString().trim().toUpperCase() : userData.govId,
    password: normalizePassword(userData.password)
  };
  const idx   = users.findIndex(u => normalizeText(u.email) === normalizeText(normalizedUser.email));
  if (idx >= 0) users[idx] = { ...users[idx], ...normalizedUser };
  else users.push(normalizedUser);
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
}

export function findUser(emailOrUsername, password) {
  const users = getAllUsers();
  const lookup = normalizeText(emailOrUsername);
  const secret = normalizePassword(password);
  return users.find(u =>
    (normalizeText(u.email) === lookup || normalizeText(u.username) === lookup) &&
    normalizePassword(u.password) === secret
  ) || null;
}

export function findGovUser(govId, password) {
  // Gov users live in same DB with role="government"
  const users = getAllUsers();
  const lookup = (govId ?? "").toString().trim().toUpperCase();
  const secret = normalizePassword(password);
  return users.find(u =>
    (u.govId ?? "").toString().trim().toUpperCase() === lookup &&
    normalizePassword(u.password) === secret &&
    u.role === "government"
  ) || null;
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

export function setSession(user) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
  // Keep backward-compat with existing code that reads "user"
  if (user) localStorage.setItem("user", JSON.stringify(user));
  else localStorage.removeItem("user");
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("user");
}

// Seed a demo government account if none exists
export function seedGovAccount() {
  const users = getAllUsers();
  const govExists = users.some(u => u.role === "government");
  if (!govExists) {
    saveUser({
      name: "Ministry of Cyber Security",
      email: "gov.admin@cert-in.gov.in",
      username: "gov_admin",
      govId: "GOV-CERT-001",
      password: "gov@secure123",
      role: "government",
      department: "CERT-In, MeitY",
      clearance: "TOP SECRET",
      isGuest: false,
      createdAt: new Date().toISOString(),
    });
  }
}
