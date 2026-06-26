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
/* =========================
   분양 목록 조회
========================= */

app.get("/api/pets", (req, res) => {

    db.all(
        "SELECT * FROM pets ORDER BY id DESC",
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.json(rows);

        }
    );

});

/* =========================
   분양 등록
========================= */

app.post("/api/pets", (req, res) => {

    const { type, name, sex, info } = req.body;

    if (!type || !name || !sex || !info) {
        return res.status(400).json({
            success: false,
            message: "모든 항목을 입력하세요."
        });
    }

    db.run(
        `INSERT INTO pets(type, name, sex, info)
         VALUES (?, ?, ?, ?)`,
        [type, name, sex, info],
        function(err) {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            db.get(
                "SELECT * FROM pets WHERE id = ?",
                [this.lastID],
                (err, row) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });
                    }

                    res.json({
                        success: true,
                        pet: row
                    });

                }
            );

        }
    );

});
