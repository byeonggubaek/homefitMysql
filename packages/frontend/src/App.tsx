import { Routes, Route } from "react-router-dom";
import MainLayout from '@/layouts/MainLayout.tsx';
import Home from '@/pages/Home.tsx';
import MemberPlan from "./pages/MemberPlan";
import MemberProfile from "./pages/MemberProfile";
import RewardExchange from "./pages/RewardExchange";
import RewardPoint from "./pages/RewardPoint";
import HistoryContent from "./pages/HistoryContent";
import HistoryState from "./pages/HistoryState";
import MemberLogin from "./pages/MemberLogin.tsx";
import MemberLogout from "./pages/MemberLogout.tsx";
import WorkoutStart from "./pages/WorkoutStart.tsx";
import WorkoutDashboard from "./pages/WorkoutDashboard.tsx";
import SystemSelect from "./pages/SystemSelect.tsx";
import SystemInsert from "./pages/SystemInsert.tsx";
import SystemUpdate from "./pages/SystemUpdate.tsx";
import RewardMall from "./pages/RewardMall.tsx";
import MemberSignup from "./pages/MemberSignup.tsx";
import SystemGraph from "./pages/SystemGraph.tsx";
import RewardAchievement from "./pages/RewardAchievement.tsx";
import MemberProfileEdit from "./sections/MemberProfileEdit.tsx";
import MemberProfilePwCheck from "./sections/MemberProfilePwCheck.tsx";
import MemberWorkReport from "./pages/MemberWorkReport.tsx";
import RewardRanking from "./pages/RewardRanking.tsx";

function App() {
  return (
    <Routes>
      {/* 모든 페이지를 MainLayout으로 감쌉니다. */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        
        {/* Workout */}
        <Route path="workout/dashboard" element={<WorkoutDashboard />} />
        <Route path="workout/start/:wor_id/:wor_id_view" element={<WorkoutStart />} />
        
        {/* History */}
        <Route path="history/state" element={<HistoryState />} />
        <Route path="history/content" element={<HistoryContent />} />
        
        {/* Reward */}
        <Route path="reward/exchange" element={<RewardExchange />} />
        <Route path="reward/point" element={<RewardPoint />} />
        <Route path="reward/ranking" element={<RewardRanking />} />
        <Route path="reward/mall" element={<RewardMall />} />
        <Route path="reward/achievement" element={<RewardAchievement />} />
        
        {/* Member */}
        <Route path="member/signup" element={<MemberSignup />} />
        <Route path="member/profile/:part" element={<MemberProfile />} />
        <Route path="member/plan" element={<MemberPlan />} />
        <Route path="member/login" element={<MemberLogin />} />
        <Route path="member/logout" element={<MemberLogout />} />
        <Route path="member/workreport" element={<MemberWorkReport />} />
        <Route path="member/pwcheck" element={<MemberProfilePwCheck />} />
        <Route path="member/edit" element={<MemberProfileEdit />} />

        {/* System */}
        <Route path="system/select" element={<SystemSelect />} />
        <Route path="system/insert" element={<SystemInsert />} />
        <Route path="system/update" element={<SystemUpdate />} />
        <Route path="system/graph" element={<SystemGraph />} />

        {/* 위 경로 외 모든 요청에 대한 404 처리 */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Route>
    </Routes>
  );
}

export default App;