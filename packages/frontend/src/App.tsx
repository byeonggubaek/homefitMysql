import { Routes, Route } from "react-router-dom";
import MainLayout from '@/layouts/MainLayout.tsx';
import Home from '@/pages/Home.tsx';
import MemberPlan from "./pages/MemberPlan";
import MemberProfile from "./pages/MemberProfile";
import MemberRegister from "./pages/MemberRegister.tsx";
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />           {/* / */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Route>
      <Route path="/workout/dashboard" element={<MainLayout />}>
        <Route index element={<WorkoutDashboard />} />           {/* / */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Route>
      <Route path="/workout/start" element={<MainLayout />}>
        <Route index element={<WorkoutStart />} />           {/* / */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Route>
      <Route path="/history/state" element={<MainLayout />}>
        <Route index element={<HistoryState />} />           {/* / */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Route>      
      <Route path="/history/content" element={<MainLayout />}>
        <Route index element={<HistoryContent />} />           {/* / */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Route>      
      <Route path="/reward/exchange" element={<MainLayout />}>
        <Route index element={<RewardExchange />} />           {/* / */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Route>      
      <Route path="/reward/point" element={<MainLayout />}>
        <Route index element={<RewardPoint />} />           {/* / */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Route>      
      <Route path="/member/register" element={<MainLayout />}>
        <Route index element={<MemberRegister />} />           {/* / */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Route>            
      <Route path="/member/profile/:part" element={<MainLayout />}>
        <Route index element={<MemberProfile />} />           {/* / */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Route>      
      <Route path="/member/plan" element={<MainLayout />}>
        <Route index element={<MemberPlan />} />           {/* / */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Route>    
      <Route path="/member/login" element={<MainLayout />}>
        <Route index element={<MemberLogin />} />           {/* / */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Route>           
      <Route path="/member/logout" element={<MainLayout />}>
        <Route index element={<MemberLogout />} />           {/* / */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Route>           
      <Route path="/system/select" element={<MainLayout />}>
        <Route index element={<SystemSelect />} />           {/* / */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Route>           
      <Route path="/system/insert" element={<MainLayout />}>
        <Route index element={<SystemInsert />} />           {/* / */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Route>           
      <Route path="/system/update" element={<MainLayout />}>
        <Route index element={<SystemUpdate />} />           {/* / */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Route>           
    </Routes>
  );
}

export default App;