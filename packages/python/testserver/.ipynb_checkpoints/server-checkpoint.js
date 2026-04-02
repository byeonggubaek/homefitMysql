// express -> 서버만들기
// axios   -> Python 서버 요청
// cors    -> 웹 연결 허용
const express = require("express"); 
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// FastAPI 서버로 보내기
app.post("/point", async (req, res) => {
    try {
        // FastAPI가 요구하는 모든 키를 포함하도록 데이터 구성
        const data = {
            user_id: req.body.user_id || "test_user",
            completion: req.body.completion || 0,
            pose: req.body.pose || 0,
            streak: req.body.streak || 0,
            goal: req.body.goal || 0,
            time: req.body.time || 0,
            body: req.body.body || 0
        };

        // FastAPI에 POST 요청
        const response = await axios.post(
            "http://127.0.0.1:8000/predict",
            data
        );

        res.json(response.data);

    } catch (err) {
        console.log(err.response?.data || err.message);
        res.status(500).send("AI Server Error");
    }
});

app.listen(3000, () => {
    console.log("Node Server Running on 3000");
});