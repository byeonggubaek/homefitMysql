import React, { useEffect, useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { 
  PoseLandmarker, 
  FilesetResolver, 
  DrawingUtils,
  type PoseLandmarkerResult 
} from '@mediapipe/tasks-vision';
import WdogWorkout from '@/components/WdogWorkout';
import type { WorkoutDetail } from 'shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from '@/components/ui/button';

const WorkoutStartMain: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 상태 관리
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<string>("대기 중...");
  const [count, setCount] = useState(0);       // 스쿼트, 푸시업, 런지용
  const [plankTime, setPlankTime] = useState(0); // 플랭크 유지 시간
  const [status, setStatus] = useState<'up' | 'down'>('up');
  const [isPlankActive, setIsPlankActive] = useState(false);

  // 1. Pose Landmarker 초기화
  const initializePoseLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    
    poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
    });
  };

  // 2. 세 점 사이의 각도 계산 (핵심 로직)
  const calculateAngle = (a: any, b: any, c: any) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  // 3. 실시간 프레임 분석 루프
  const predictWebcam = useCallback(() => {
    const video = webcamRef.current?.video;
    
    if (poseLandmarkerRef.current && video && video.readyState === 4) {
      const startTimeMs = performance.now();
      const results = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);
      
      processExerciseLogic(results);
      drawResults(results);
    }
    
    if (isDetecting) {
      requestRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [isDetecting, status, isPlankActive]);

  // 4. 운동 종류 판별 및 카운팅 로직
  const processExerciseLogic = (results: PoseLandmarkerResult) => {
    if (!results.landmarks || results.landmarks.length === 0) {
      setCurrentExercise("사람을 감지할 수 없습니다");
      setIsPlankActive(false);
      return;
    }

    const lm = results.landmarks[0];
    
    // 주요 관절 포인트 (오른쪽 기준)
    const shoulder = lm[12], elbow = lm[14], wrist = lm[16]; // 상체
    const hip = lm[24], knee = lm[26], ankle = lm[28];      // 하체

    const armAngle = calculateAngle(shoulder, elbow, wrist);
    const legAngle = calculateAngle(hip, knee, ankle);
    const bodyLine = calculateAngle(shoulder, hip, ankle); // 플랭크용 일직선도

    // --- 운동 분류 알고리즘 ---
    
    // [플랭크] 몸이 일직선(160도 이상)이고 팔이 굽혀져 있음
    if (bodyLine > 165 && armAngle < 120) {
      setCurrentExercise("플랭크 유지 중! 🔥");
      setIsPlankActive(true);
    } 
    // [푸시업] 몸이 직선인데 팔 각도가 변함
    else if (bodyLine > 150 && armAngle < 150) {
      setCurrentExercise("푸시업 중");
      setIsPlankActive(false);
      handleCount(armAngle, 90, 150);
    }
    // [스쿼트/런지] 다리 각도가 변함
    else if (legAngle < 150) {
      setCurrentExercise(legAngle < 100 ? "스쿼트 진행 중" : "자세를 더 낮추세요");
      setIsPlankActive(false);
      handleCount(legAngle, 100, 160);
    }
    else {
      setCurrentExercise("준비 자세");
      setIsPlankActive(false);
    }
  };

  const handleCount = (angle: number, downLimit: number, upLimit: number) => {
    if (angle < downLimit) {
      setStatus('down');
    } else if (angle > upLimit && status === 'down') {
      setStatus('up');
      setCount(prev => prev + 1);
    }
  };

  // 5. 플랭크 타이머 처리
  useEffect(() => {
    if (isPlankActive && isDetecting) {
      timerRef.current = setInterval(() => setPlankTime(p => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlankActive, isDetecting]);

  // 6. 시작/중지 컨트롤
  const startDetection = () => {
    setIsDetecting(true);
    setCount(0);
    setPlankTime(0);
  };

  const stopDetection = () => {
    setIsDetecting(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.clearRect(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0);
  };

  // 7. 캔버스 렌더링
  const drawResults = (results: PoseLandmarkerResult) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const drawingUtils = new DrawingUtils(ctx);

    if (results.landmarks) {
      for (const landmarks of results.landmarks) {
        drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: '#ffffff55', lineWidth: 2 });
        drawingUtils.drawLandmarks(landmarks, { radius: 2, color: isPlankActive ? '#f97316' : '#22c55e' });
      }
    }
  };

  useEffect(() => {
    initializePoseLandmarker();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      poseLandmarkerRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (isDetecting) requestRef.current = requestAnimationFrame(predictWebcam);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); }
  }, [isDetecting, predictWebcam]);

  // 데이터 로딩 (기존 로직 유지)
  const [workouts, setWorkout] = useState<WorkoutDetail[] | null>(null);
  useEffect(() => {
    fetch(`http://localhost:3001/api/workout/getWorkoutDetails?wor_id=WOR00001`)
      .then(res => res.json())
      .then(data => setWorkout(data.data));    
  }, []);

  return (
    <div className="w-full flex items-start gap-6 p-6 bg-slate-50 min-h-screen"> 
      <div className="w-3/5">
        <Card className="overflow-hidden border-none shadow-xl">
          <CardHeader className="bg-white pb-4">
            <div className="flex justify-between items-end">
              <div>
                <CardTitle className="text-3xl font-black text-slate-800 tracking-tight">
                  {isDetecting ? currentExercise : "운동을 시작하세요"}
                </CardTitle>
                <CardDescription className="text-base">AI가 실시간으로 자세를 교정해드립니다.</CardDescription>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase">Count</p>
                  <p className="text-5xl font-black text-blue-600">{count}</p>
                </div>
                <div className="text-center border-l pl-6">
                  <p className="text-xs font-bold text-slate-400 uppercase">Plank</p>
                  <p className="text-5xl font-black text-orange-500">{plankTime}<span className="text-xl">s</span></p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button size="lg" className="flex-1 text-lg font-bold" onClick={startDetection} disabled={isDetecting}>운동 시작</Button>
              <Button size="lg" variant="destructive" className="flex-1 text-lg font-bold" onClick={stopDetection} disabled={!isDetecting}>중지</Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 relative bg-black aspect-video">
            <Webcam ref={webcamRef} audio={false} mirrored className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full z-10" style={{ transform: 'scaleX(-1)' }} />
            
            {/* 상태 오버레이 */}
            {isDetecting && (
              <div className={`absolute bottom-6 left-6 z-20 px-6 py-3 rounded-2xl font-bold text-xl shadow-2xl ${status === 'down' ? 'bg-green-500 text-white' : 'bg-white/90 text-slate-800'}`}>
                {status === 'down' ? "▼ GO DOWN" : "▲ UP"}
              </div>
            )}
            {isPlankActive && <div className="absolute inset-0 border-[12px] border-orange-500/50 animate-pulse z-0" />}
          </CardContent>
        </Card>
      </div>

      <div className="w-2/5 flex flex-col gap-6">
        <Card className="h-full border-none shadow-lg">
          <CardHeader className="border-b">
            <CardTitle>오늘의 운동 목표</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-3">
            {workouts?.map((workout, index) => (
              <WdogWorkout key={workout.WOO_ID ?? index} workout={workout} index={index} type="start" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkoutStartMain;