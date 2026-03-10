const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Controllers
const scanController = require("./controllers/scanController");

// Middleware
app.use(cors());
app.use(express.json());

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({
    message: "Cyber Attack Visualizer Backend Running",
    port: PORT,
    time: new Date()
  });
});

// ================= SCAN ROUTE =================
app.post("/api/scan", scanController.performScan);

// ================= LOCAL DATABASE ROUTES =================
app.get("/api/attacks", scanController.getAllAttacks);
app.get("/api/attacks/search", scanController.searchAttacks);
app.delete("/api/attacks/:id", scanController.deleteAttack);

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Cyber Backend running at http://localhost:${PORT}`);
});
