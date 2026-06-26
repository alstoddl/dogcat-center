const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
const app = express();

app.set("trust proxy", true);

app.use(cors());
app.use(express.json());

// 메모리 저장 (서버 재시작 시 초기화됨)
let pets = [];

/* 목록 조회 */
app.get("/api/pets", (req, res) => {
  res.json(pets);
});

/* 등록 */
app.post("/api/pets", (req, res) => {
  const { type, name, sex, info } = req.body;

  if (!type || !name || !sex || !info) {
    return res.status(400).json({
      success: false,
      message: "모든 항목을 입력하세요."
    });
  }

  const pet = {
    id: Date.now(),
    type,
    name,
    sex,
    info,
    createdAt: new Date().toISOString()
  };

  pets.push(pet);

  res.json({
    success: true,
    pet
  });
});

/* 수정 */
app.put("/api/pets/:id", (req, res) => {
  const id = Number(req.params.id);

  const pet = pets.find(p => p.id === id);

  if (!pet) {
    return res.status(404).json({
      success: false,
      message: "데이터를 찾을 수 없습니다."
    });
  }

  pet.type = req.body.type ?? pet.type;
  pet.name = req.body.name ?? pet.name;
  pet.sex = req.body.sex ?? pet.sex;
  pet.info = req.body.info ?? pet.info;

  res.json({
    success: true,
    pet
  });
});

/* 삭제 */
app.delete("/api/pets/:id", (req, res) => {
  const id = Number(req.params.id);

  pets = pets.filter(p => p.id !== id);

  res.json({
    success: true
  });
});

/* 강아지/고양이 개수 */
app.get("/api/count", (req, res) => {
  res.json({
    dog: pets.filter(p => p.type === "dog").length,
    cat: pets.filter(p => p.type === "cat").length,
    total: pets.length
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
/* ==========================
   방문자(IP 하루 1회)
========================== */

let today = new Date().toISOString().slice(0, 10);
let todayCount = 0;
const visitedIPs = new Set();

app.get("/api/visit", (req, res) => {
  const now = new Date().toISOString().slice(0, 10);

  // 날짜가 바뀌면 초기화
  if (now !== today) {
    today = now;
    todayCount = 0;
    visitedIPs.clear();
  }

  // 실제 접속 IP
  const ip =
    (req.headers["x-forwarded-for"] || "")
      .split(",")[0]
      .trim() ||
    req.socket.remoteAddress;

  // 오늘 처음 방문한 IP만 카운트
  if (!visitedIPs.has(ip)) {
    visitedIPs.add(ip);
    todayCount++;
  }

  res.json({
    today: todayCount
  });
});
