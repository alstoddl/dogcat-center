const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", true);

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./pets.db");

/* =========================
   데이터베이스 생성
========================= */

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS pets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            sex TEXT NOT NULL,
            info TEXT NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            visitDate TEXT NOT NULL,
            ip TEXT NOT NULL
        )
    `);

});

/* =========================
   서버 확인
========================= */

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "Pet Center API Running"
    });

});
