import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useCallback, useState } from 'react';
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
import { useUser } from '@/hooks/UserContext';


interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

interface PoseLandmarkerResult {
  landmarks: Landmark[][];
}

interface PoseValidationResult {
  valid: boolean;
  missing: number[] | null;
  lowVisibility: number[] | null;
  confidence: string;
  head?: boolean;
  shoulders?: boolean;
  arms?: boolean;
  hips?: boolean;
  legs?: boolean;
  ankles?: boolean;
  readyForExercise?: boolean;
  feedback?: string;
}

const WorkoutStartMain = () => {
  const { wor_id, wor_id_view } = useParams<{ wor_id: string, wor_id_view: string }>();
  const { member } = useUser();
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 🌟 [핵심] API 과부하 방지 및 실시간 상태 저장을 위한 주머니(Lock & Ref)
  const isApiProcessing = useRef<boolean>(false);
  const currentAiExerciseRef = useRef<string>("");
  const statusRef = useRef<'up' | 'down'>('up'); // 💡 빠른 웹캠 속도를 따라가기 위한 카운트 상태 주머니

  // 화면 표시용 상태 관리 (State)
  const [isDetecting, setIsDetecting] = useState(false);
  const [viewExercise, setViewExercise] = useState(""); // DB 저장용 카운트
  const [viewProbability, setViewProbability] = useState(0); // DB 저장용 카운트
  const [currentExercise, setCurrentExercise] = useState<string>("대기 중...");
  const [probability, setProbability] = useState<number>(0);
  const [count, setCount] = useState(0);
  const [plankTime, setPlankTime] = useState(0);
  const [status, setStatus] = useState<'up' | 'down'>('up'); // 화면 UI용
  const [isPlankActive, setIsPlankActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false); // 🌟 운동 완료 여부
  const [earnedPoint, setEarnedPoint] = useState(0);   // 🌟 방금 획득한 포인트


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

  // 2. 세 점 사이의 각도 계산
  const calculateAngle = (a: any, b: any, c: any) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const checkKeyLandmarks = (results: PoseLandmarkerResult): PoseValidationResult => {

    console.log ("🔍 랜드마크 검증 중...", results.landmarks);
    if (!results.landmarks || !results.landmarks[0]) {
      return { 
        valid: false, 
        missing: null, 
        lowVisibility: null,
        confidence: 'No landmarks detected' 
      };
    }
    
    const landmarks: Landmark[] = results.landmarks[0];
    const requiredIndices: number[] = [11,12,13,14,23,24,25,26,27,28];
    const missing: number[] = [];
    const lowVisibility: number[] = [];
    
    requiredIndices.forEach((index: number) => {
      const landmark: Landmark | undefined = landmarks[index];
      if (!landmark) {
        missing.push(index);
      } else if (landmark.visibility < 0.5) {
        lowVisibility.push(index);
      }
    });
    
    const valid: boolean = missing.length === 0 && lowVisibility.length === 0;
    
    return {
      valid,
      missing: missing.length > 0 ? missing : null,
      lowVisibility: lowVisibility.length > 0 ? lowVisibility : null,
      confidence: valid ? '전신 완벽!' : '일부 가려짐'
    };
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
  }, [isDetecting, isPlankActive]); // status 의존성 제거 (주머니 사용)

  // 4. FastAPI로 좌표 쏘는 함수
  const callAiServer = async (landmarks: any[]) => {
    if (isApiProcessing.current) return;
    isApiProcessing.current = true;

    try {
      // 0:  NOSE (코)
      // 11: LEFT_SHOULDER (왼쪽 어깨)
      // 12: RIGHT_SHOULDER (오른쪽 어깨)
      // 13: LEFT_ELBOW (왼쪽 팔꿈치)
      // 14: RIGHT_ELBOW (오른쪽 팔꿈치)
      // 23: LEFT_HIP (왼쪽 엉덩이)
      // 24: RIGHT_HIP (오른쪽 엉덩이)
      // 25: LEFT_KNEE (왼쪽 무릎)
      // 26: RIGHT_KNEE (오른쪽 무릎)
      // 27: LEFT_ANKLE (왼쪽 발목)
      // 28: RIGHT_ANKLE (오른쪽 발목)
      const targetIndices = [0, 11, 12, 13, 14, 23, 24, 25, 26, 27, 28];
      const inputRow: number[] = [];

      targetIndices.forEach(idx => {
        const lm = landmarks[idx];
        inputRow.push(lm.x * 1000, lm.y * 1000);
      });

      const res = await fetch('http://localhost:8000/predict_exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landmarks: inputRow })
      });
      const data = await res.json();

      if (data.success) {
        // console.log(`AI 예측 결과: ${data.exercise} (${data.probability}%)`);
        setCurrentExercise(data.exercise);
        setProbability(data.probability);

        // 💡 AI가 판별한 운동을 몰래 주머니에 저장! (실시간 연동용)
        currentAiExerciseRef.current = data.exercise;

        setIsPlankActive(data.exercise.toLowerCase() === 'plank');
      }
    } catch (error) {
      console.error("AI 서버 통신 에러:", error);
    } finally {
      isApiProcessing.current = false;
    }
  };

  // 5. 로직 처리 (AI 분류 + 기존 카운팅 병합)
  const processExerciseLogic = (results: PoseLandmarkerResult) => {
    if (!results.landmarks || results.landmarks.length === 0) {
      setCurrentExercise("사람을 감지할 수 없습니다");
      setIsPlankActive(false);
      return;
    }
    checkKeyLandmarks(results); // 💡 AI 서버에 보내기 전에 필수 랜드마크 체크 (결과는 로그용)
    const lm = results.landmarks[0];
    callAiServer(lm);

    //12: 오른쪽 어깨 (right shoulder)
    //14: 오른쪽 팔꿈치 (right elbow)
    //16: 오른쪽 손목 (right wrist)
    //24: 오른쪽 엉덩이 (right hip)
    //26: 오른쪽 무릎 (right knee)
    //28: 오른쪽 발목 (right ankle)
    const shoulder = lm[12], elbow = lm[14], wrist = lm[16];
    const hip = lm[24], knee = lm[26], ankle = lm[28];
    const armAngle = calculateAngle(shoulder, elbow, wrist);
    const legAngle = calculateAngle(hip, knee, ankle);

    // 💡 State 대신 주머니(Ref)에 있는 최신 운동값을 가져와서 비교합니다!
    const aiResult = currentAiExerciseRef.current.toLowerCase();

    // 카운트 인식 각도 완화 (살짝만 굽혀도 인정!)
    if (aiResult === 'pushup') {
      handleCount(armAngle, 100, 140);
    }
    else if (aiResult === 'squat' || aiResult === 'lunge') {
      handleCount(legAngle, 120, 150); // 무릎 120도 이하로 굽히면 DOWN, 150도 이상 펴면 UP
    }
  };

  const handleCount = (angle: number, downLimit: number, upLimit: number) => {
    // 💡 빠른 속도를 위해 비교는 주머니(Ref)로 하고, 표시는 State로 합니다.
    if (angle < downLimit) {
      statusRef.current = 'down';
      setStatus('down');
    } else if (angle > upLimit && statusRef.current === 'down') {
      statusRef.current = 'up';
      setStatus('up');
      if(probability > 30){
        setCount(prev => prev + 1); // 🔥 여기서 카운트 증가!
        setViewExercise(currentExercise.toUpperCase()); // DB 저장용 카운트 업데이트
        setViewProbability(probability); // DB 저장용 카운트 업데이트
        // console.log(`카운트 증가! 현재 카운트: ${count + 1}, 운동: ${currentExercise}, 정확도: ${probability}%`);
      }
    }
  };

  // 플랭크 타이머 처리
  useEffect(() => {
    if (isPlankActive && isDetecting) {
      timerRef.current = setInterval(() => setPlankTime(p => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlankActive, isDetecting]);

  // 시작/중지 컨트롤
  const startDetection = () => {
    setIsDetecting(true);
    setCount(0);
    setViewExercise("");
    setViewProbability(0);
    setPlankTime(0);
    statusRef.current = 'up'; // 주머니 초기화
    setStatus('up');
  };

  const stopDetection = () => {
    setIsDetecting(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.clearRect(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0);
  };

  // 캔버스 렌더링
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

  const [workouts, setWorkout] = useState<WorkoutDetail[] | null>(null);
  useEffect(() => {
    if (!wor_id) return;
    fetch(`http://localhost:3001/api/workout/getWorkoutDetails?mem_id=${member?.MEM_ID}&wor_id=${wor_id}`)
      .then(res => res.json())
      .then(data => {
        setWorkout(data.data);
      });
  }, [wor_id, member?.MEM_ID]);

  // 운동 완료 및 DB 저장 로직
  const saveWorkout = async () => {
    stopDetection();

    // 💡 1. AI가 인식한 운동 이름을 번호(WOO_ID)로 변환
    const aiEx = currentAiExerciseRef.current.toLowerCase();
    let targetWooId = 2; // 기본값 스쿼트(2)
    if (aiEx === 'plank') targetWooId = 1;
    else if (aiEx === 'squat') targetWooId = 2;
    else if (aiEx === 'pushup') targetWooId = 3;
    else if (aiEx === 'lunge') targetWooId = 4;

    // 💡 2. payload에 woo_id 추가해서 포장!
    const payload = {
      mem_id: member?.MEM_ID,
      wor_id: wor_id,
      woo_id: targetWooId, // 🔥 추가된 핵심 데이터! (몇 번 운동인지)
      count: count,
      duration: plankTime,
      accuracy: Math.floor(Math.random() * 11) + 90
    };

    try {
      const res = await fetch('http://localhost:3001/api/workout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        // ✅ 1. 포인트 값을 저장하고 완료 상태로 변경! (페이지 이동은 안 함)
        setEarnedPoint(data.earnedPoint || 0);
        setIsFinished(true);
      } else {
        alert("저장에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("저장 중 에러 발생:", error);
    }
  };
  return (
    <div className="w-full flex items-start gap-6 bg-slate-50">
      <div className="w-1/2 max-w-2xl">
        <Card className="overflow-hidden border-none shadow-xl">
          <CardHeader className="bg-white pb-4">
            <div className="flex justify-between items-end">
              <div>
                <CardTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  운동 시작 : {wor_id_view ?? ''}
                </CardTitle>
                <CardDescription className="text-sm">실시간 AI 자세 분석 중</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Count</p>
                  <p className="text-3xl font-black text-blue-600">{count}</p>
                </div>
                <div className="text-center border-l pl-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Plank</p>
                  <p className="text-3xl font-black text-orange-500">{plankTime}s</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full justify-end mt-4">
              <div className="w-full text-left">
                {isDetecting ? (
                  <>
                    {currentExercise.toUpperCase()}
                    {probability > 0 && <span className="text-sm text-blue-500 bg-blue-50 px-2 py-1 rounded-full">{probability}%</span>}
                  </>
                ) : ""}
              </div>
              <Button size="sm" className="w-20 h-8 text-xs font-bold" onClick={startDetection} disabled={isDetecting}>시작</Button>
              <Button size="sm" variant="destructive" className="w-20 h-8 text-xs font-bold" onClick={stopDetection} disabled={!isDetecting}>중지</Button>
              <Button size="sm" className="w-28 h-8 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md" onClick={saveWorkout}
                disabled={isDetecting}> 🚩 운동 완료 </Button>
            </div>
            {/* 🌟 [추가] 운동 완료 시 나타나는 결과 창1024 */}
            {isFinished && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center">
                <div className="bg-white rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300 max-w-sm w-full">
                  <div className="text-6xl mb-4">🏆</div>
                  <h2 className="text-3xl font-black text-slate-800 mb-2">수고하셨습니다!</h2>
                  <p className="text-slate-500 mb-6 font-medium">오늘의 운동 기록이 성공적으로 저장되었습니다.</p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">Count</p>
                      <p className="text-2xl font-black text-blue-600">{count}회</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                      <p className="text-xs text-blue-400 font-bold uppercase mb-1">Point</p>
                      <p className="text-2xl font-black text-blue-600">+{earnedPoint}P</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      className="w-full py-6 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                      onClick={() => navigate('/reward/point')}
                    >
                      포인트 내역 확인하기
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-slate-400 font-bold"
                      onClick={() => navigate('/workout/dashboard')}
                    >
                      나중에 볼래요
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-20 relative bg-black aspect-4/3 overflow-hidden">
            <Webcam
              ref={webcamRef} audio={false} mirrored
              className="absolute inset-0 w-full h-full object-cover"
              videoConstraints={{ 
                width: 1280,                    // 넓은 FOV
                height: 720,                    // 세로 충분히
                facingMode: 'user',             // 전면 카메라
                aspectRatio: 16/9               // 가로세로 비율
              }}
            />
            <canvas ref={canvasRef} width={1280} height={720} className="absolute inset-0 w-full h-full z-10" style={{ transform: 'scaleX(-1)' }} />
            {isDetecting && (
              <div className={`absolute bottom-4 left-4 z-20 px-4 py-2 rounded-lg font-bold text-base shadow-2xl ${status === 'down' ? 'bg-green-500 text-white' : 'bg-white/90 text-slate-800'}`}>
                {status === 'down' ? "▼ DOWN" : "▲ UP"}
              </div>
            )}
            {isPlankActive && <div className="absolute inset-0 border-8 border-orange-500/50 animate-pulse z-0" />}
          </CardContent>
        </Card>
      </div>

      <div className="w-full">
        <Card className="w-full border-none shadow-lg">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-lg">오늘의 목표</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-3">
            {workouts?.map((workout, index) => (
              <WdogWorkout key={workout.WOO_ID ?? index} workout={workout} index={index} type="dashboard" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkoutStartMain;