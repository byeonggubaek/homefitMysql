# FastAPI 서버 생성
from fastapi import FastAPI
# 요청 JSON 구조를 정의하기 위한 라이브러리
from pydantic import BaseModel
# 머신러닝 모델 로드용
import joblib
# 데이터프레임 생성
import pandas as pd
# MySQL DB 연결
import pymysql


# FastAPI 앱 객체 생성
app = FastAPI()

# -----------------------------
# 1️⃣ AI 모델 불러오기
# -----------------------------
# 미리 학습된 머신러닝 모델(pkl 파일)을 로드
model = joblib.load("point_model.pkl")

# -----------------------------
# 2️⃣ MySQL DB 연결
# -----------------------------
# 로컬 MySQL 데이터베이스에 연결
conn = pymysql.connect(
    host="localhost",     # DB 서버 주소
    user="root",          # DB 사용자
    password="12345",     # DB 비밀번호
    database="homefit",   # 사용할 데이터베이스
    charset="utf8"
)

# SQL 실행용 커서 생성
cursor = conn.cursor()

# -----------------------------
# 3️⃣ 요청 데이터 구조 정의
# -----------------------------
# Swagger에서 자동 JSON 입력칸을 만들기 위해 필요
class PredictRequest(BaseModel):
    # 운동 완료율
    completion: int
    # 자세 점수
    pose: int
    # 연속 운동 일수
    streak: int
    # 목표 달성 점수
    goal: int
    # 운동 시간
    time: int
    # 신체 활동 점수
    body: int
    # 사용자 ID
    user_id: str

# -----------------------------
# 4️⃣ 예측 API
# -----------------------------
# POST 방식으로 /predict API 생성
@app.post("/predict")
# Swagger에서 받은 JSON이 data 객체로 들어옴
async def predict(data: PredictRequest):

    # -----------------------------
    # 5️⃣ 모델 입력 데이터 생성
    # -----------------------------
    # 머신러닝 모델 입력을 위해 DataFrame 생성
    df = pd.DataFrame([[
        data.completion,
        data.pose,
        data.streak,
        data.goal,
        data.time,
        data.body
    ]],
    columns=[
        "completion",
        "pose",
        "streak",
        "goal",
        "time",
        "body"
    ])

    # -----------------------------
    # 6️⃣ AI 포인트 예측
    # -----------------------------
    # 모델이 포인트 계산
    point = int(model.predict(df)[0])

    # -----------------------------
    # 7️⃣ DB 저장
    # -----------------------------
    # 예측 결과를 user_points 테이블에 저장
    sql = """
    INSERT INTO user_points
    (user_id, posture_score, duration, continuity, goal_score, total_point)
    VALUES (%s,%s,%s,%s,%s,%s)
    """

    cursor.execute(sql, (
        data.user_id,   # 사용자 ID
        data.pose,      # 자세 점수
        data.time,      # 운동 시간
        data.streak,    # 연속 운동
        data.goal,      # 목표 점수
        point           # AI가 계산한 포인트
    ))

    # DB 저장 확정
    conn.commit()

    # -----------------------------
    # 8️⃣ 결과 반환
    # -----------------------------
    # 클라이언트에게 포인트 반환
    return {"point": point}
