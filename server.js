require('dotenv').config();
const express = require("express");
const mysql = require("mysql2/promise"); // Using promises instead of callbacks
const path = require("path");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Database Configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "conrad",
  database: process.env.DB_NAME || "seed_inventory",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Database Initialization
async function initializeDatabase() {
  try {
    const queries = [
      `CREATE TABLE IF NOT EXISTS inward (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seedName VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        party VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS outward (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seedName VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        party VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS returns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seedName VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS expiry (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seedName VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        expiryDate DATE NOT NULL,
        action VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    const connection = await pool.getConnection();
    for (const query of queries) {
      await connection.query(query);
    }
    connection.release();
    console.log("✅ Database tables initialized");
  } catch (err) {
    console.error("❌ Database initialization failed:", err);
    process.exit(1);
  }
}

// API Endpoints

// Helper function for error handling
const handleDbError = (res, err) => {
  console.error("Database error:", err);
  res.status(500).json({ error: "Database operation failed" });
};

// Create operations
app.post("/api/inward", async (req, res) => {
  try {
    const { seedName, quantity, party, date, notes } = req.body;
    const [result] = await pool.query(
      "INSERT INTO inward (seedName, quantity, party, date, notes) VALUES (?, ?, ?, ?, ?)",
      [seedName, quantity, party, date, notes]
    );
    res.json({ message: "Inward entry added", id: result.insertId });
  } catch (err) {
    handleDbError(res, err);
  }
});

app.post("/api/outward", async (req, res) => {
  try {
    const { seedName, quantity, party, date, notes } = req.body;
    const [result] = await pool.query(
      "INSERT INTO outward (seedName, quantity, party, date, notes) VALUES (?, ?, ?, ?, ?)",
      [seedName, quantity, party, date, notes]
    );
    res.json({ message: "Outward entry added", id: result.insertId });
  } catch (err) {
    handleDbError(res, err);
  }
});

app.post("/api/returns", async (req, res) => {
  try {
    const { seedName, quantity, reason, date, notes } = req.body;
    const [result] = await pool.query(
      "INSERT INTO returns (seedName, quantity, reason, date, notes) VALUES (?, ?, ?, ?, ?)",
      [seedName, quantity, reason, date, notes]
    );
    res.json({ message: "Return entry added", id: result.insertId });
  } catch (err) {
    handleDbError(res, err);
  }
});

app.post("/api/expiry", async (req, res) => {
  try {
    const { seedName, quantity, expiryDate, action } = req.body;
    const [result] = await pool.query(
      "INSERT INTO expiry (seedName, quantity, expiryDate, action) VALUES (?, ?, ?, ?)",
      [seedName, quantity, expiryDate, action]
    );
    res.json({ message: "Expiry entry added", id: result.insertId });
  } catch (err) {
    handleDbError(res, err);
  }
});

// Read operations
app.get("/api/inward", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM inward ORDER BY createdAt DESC");
    res.json(results);
  } catch (err) {
    handleDbError(res, err);
  }
});

app.get("/api/outward", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM outward ORDER BY createdAt DESC");
    res.json(results);
  } catch (err) {
    handleDbError(res, err);
  }
});

app.get("/api/returns", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM returns ORDER BY createdAt DESC");
    res.json(results);
  } catch (err) {
    handleDbError(res, err);
  }
});

app.get("/api/expiry", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM expiry ORDER BY createdAt DESC");
    res.json(results);
  } catch (err) {
    handleDbError(res, err);
  }
});

// Delete operations
app.delete("/api/inward/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM inward WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.json({ message: "Inward entry deleted" });
  } catch (err) {
    handleDbError(res, err);
  }
});

app.delete("/api/outward/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM outward WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.json({ message: "Outward entry deleted" });
  } catch (err) {
    handleDbError(res, err);
  }
});

app.delete("/api/returns/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM returns WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.json({ message: "Return entry deleted" });
  } catch (err) {
    handleDbError(res, err);
  }
});

app.delete("/api/expiry/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM expiry WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.json({ message: "Expiry entry deleted" });
  } catch (err) {
    handleDbError(res, err);
  }
});

// Reports endpoint
app.get("/api/reports", async (req, res) => {
  try {
    const [inwardData] = await pool.query("SELECT * FROM inward");
    const [outwardData] = await pool.query("SELECT * FROM outward");
    const [returnData] = await pool.query("SELECT * FROM returns");
    const [expiryData] = await pool.query("SELECT * FROM expiry");
    
    res.json({ inwardData, outwardData, returnData, expiryData });
  } catch (err) {
    handleDbError(res, err);
  }
});

// Serve the frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await initializeDatabase();
});