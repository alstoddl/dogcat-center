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
/* =========================
   분양 수정
========================= */

app.put("/api/pets/:id", (req, res) => {

    const id = req.params.id;
    const { type, name, sex, info } = req.body;

    db.run(
        `UPDATE pets
         SET type=?, name=?, sex=?, info=?
         WHERE id=?`,
        [type, name, sex, info, id],
        function(err) {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: "데이터를 찾을 수 없습니다."
                });
            }

            res.json({
                success: true,
                message: "수정 완료"
            });

        }
    );

});
/* =========================
   분양 삭제
========================= */

app.delete("/api/pets/:id", (req, res) => {

    const id = req.params.id;

    db.run(
        "DELETE FROM pets WHERE id=?",
        [id],
        function(err) {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: "데이터를 찾을 수 없습니다."
                });
            }

            res.json({
                success: true,
                message: "삭제 완료"
            });

        }
    );

});
/* =========================
   강아지/고양이 개수
========================= */

app.get("/api/count", (req, res) => {

    db.get(
        `
        SELECT
            SUM(CASE WHEN type='dog' THEN 1 ELSE 0 END) AS dog,
            SUM(CASE WHEN type='cat' THEN 1 ELSE 0 END) AS cat,
            COUNT(*) AS total
        FROM pets
        `,
        [],
        (err, row) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.json({
                dog: row.dog || 0,
                cat: row.cat || 0,
                total: row.total || 0
            });

        }
    );

});


/* =========================
   방문자(IP 하루 1회)
========================= */

app.get("/api/visit", (req, res) => {

    const today = new Date().toISOString().slice(0, 10);

    const ip =
        (req.headers["x-forwarded-for"] || "")
        .split(",")[0]
        .trim() || req.socket.remoteAddress;

    db.get(
        "SELECT * FROM visits WHERE visitDate=? AND ip=?",
        [today, ip],
        (err, row) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (row) {

                db.get(
                    "SELECT COUNT(*) AS today FROM visits WHERE visitDate=?",
                    [today],
                    (err, countRow) => {

                        res.json({
                            today: countRow.today
                        });

                    }
                );

            } else {

                db.run(
                    "INSERT INTO visits(visitDate, ip) VALUES(?, ?)",
                    [today, ip],
                    () => {

                        db.get(
                            "SELECT COUNT(*) AS today FROM visits WHERE visitDate=?",
                            [today],
                            (err, countRow) => {

                                res.json({
                                    today: countRow.today
                                });

                            }
                        );

                    }
                );

            }

        }
    );

});


/* =========================
   서버 실행
========================= */

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
