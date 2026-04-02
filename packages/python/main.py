# FastAPI 및 CORS 설정용
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# 요청 JSON 구조 정의
from pydantic import BaseModel
from typing import List
# 머신러닝 모델 로드 및 데이터 처리
import joblib
import pandas as pd
import numpy as np

# FastAPI 앱 객체 생성
app = FastAPI()

# -----------------------------
# 🌟 핵심: CORS 설정 (React 연동 시 필수!)
# -----------------------------
# React(보통 5173 포트)에서 FastAPI(8000 포트)로 요청을 보낼 때 차단되지 않게 해줍니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포 시에는 ["http://localhost:5173"] 처럼 지정하세요
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# 1️⃣ AI 모델 불러오기
# -----------------------------
# 팀장님이 학습시킨 운동 분류 모델 로드
print("⏳ 모델 로드 중...")
model = joblib.load("exercise_model.pkl")
print("✅ 모델 로드 완료!")

# 모델 학습 시 사용했던 컬럼명 (순서와 이름이 정확히 일치해야 함)
# 이미지에서 작성하신 target_joints 순서대로 x, y 좌표를 펼친 리스트입니다.
COLUMN_NAMES = [
    'nose_x', 'nose_y',
    'left_shoulder_x', 'left_shoulder_y', 'right_shoulder_x', 'right_shoulder_y',
    'left_elbow_x', 'left_elbow_y', 'right_elbow_x', 'right_elbow_y',
    'left_hip_x', 'left_hip_y', 'right_hip_x', 'right_hip_y',
    'left_knee_x', 'left_knee_y', 'right_knee_x', 'right_knee_y',
    'left_ankle_x', 'left_ankle_y', 'right_ankle_x', 'right_ankle_y'
]

# -----------------------------
# 2️⃣ 요청 데이터 구조 정의
# -----------------------------
class PoseRequest(BaseModel):
    # React에서 MediaPipe로 추출한 22개의 좌표값 (x, y * 11개 관절)을 리스트로 받습니다.
    # 이미 1000이 곱해진 상태로 들어온다고 가정합니다.
    landmarks: List[float]

# -----------------------------
# 3️⃣ 실시간 예측 API
# -----------------------------
@app.post("/predict_exercise")
async def predict_exercise(data: PoseRequest):
    try:
        # 프론트에서 받은 리스트 길이가 22개인지 안전장치
        if len(data.landmarks) != 22:
            return {"error": "좌표 데이터의 개수가 맞지 않습니다."}

        # -----------------------------
        # 4️⃣ 모델 입력 데이터 생성
        # -----------------------------
        # 모델이 학습할 때와 완벽하게 동일한 형태의 DataFrame으로 변환
        df = pd.DataFrame([data.landmarks], columns=COLUMN_NAMES)

        # -----------------------------
        # 5️⃣ AI 예측 수행
        # -----------------------------
        # 어떤 운동인지 예측 (예: 'Squat', 'Pushup')
        prediction = model.predict(df)[0]
        
        # 얼마나 확신하는지 확률 계산 (가장 높은 확률 추출)
        probabilities = model.predict_proba(df)[0]
        max_prob = float(np.max(probabilities)) * 100  # 퍼센트로 변환

        # -----------------------------
        # 6️⃣ 결과 반환 (DB 저장은 생략! 매우 빠름!)
        # -----------------------------
        return {
            "success": True,
            "exercise": prediction,
            "probability": round(max_prob, 2) # 예: 98.5
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}