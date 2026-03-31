// src/layouts/MainLayout.jsx
import type { NavItem } from 'shared';
import { Link, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import WdogNavi from '@/components/WdogNavi'
import WdogAutoInput from '@/components/WdogAutoInput'
import WdogAvatar from '@/components/WdogAvatar';
import { useUser } from '@/hooks/UserContext';

export default function MainLayout() {
  const {member} = useUser(); // 정보도 가져오기
  const isDarkMode = useDarkMode(); // 훅 호출
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  useEffect(() => {
    fetch('http://localhost:3001/api/getMenus?mem_id=' + (member?.MEM_ID ?? ""))  // 👈 memberId 쿼리 추가
      .then(res => res.json())
      .then(data => {
        setNavItems(data.data);  // 👈 바로 사용!
      });
  }, [member?.MEM_ID]);  // 👈 memberId가 변경될 때마다 다시 호출
  return (
    <div className="flex flex-col w-screen min-h-screen ">  
      {/* Header */}
      <header className="w-full px-1 md:px-2 lg:px-4 xl:px-7 2xl:px-10 mx-auto border-b shrink-0">  {/* ✅ flex-shrink-0 */}
        <nav className="flex justify-between items-center gap-2">
          <Link to="/" className='w-1/6'>
            <img src={isDarkMode ? "/logo_dark.svg" : "/logo.svg"} alt="Logo" className="h-10 w-auto hover:cursor-pointer" />
          </Link> 
          <div className='w-4/6'>
            <WdogNavi navItems={navItems} /> 
          </div>
          {member &&
            <div className="w-1/6">
              <WdogAutoInput />
            </div>
          }
          <div className="w-5">
            <WdogAvatar/>
          </div>
        </nav>
      </header>
      
      {/* Main: 꽉차게 + 중앙 */}
      <main className="w-full px-1 md:px-2 lg:px-4 xl:px-7 2xl:px-10 mx-auto flex-1 py-3">  {/* ✅ flex-1 */}
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="w-full px-1 md:px-2 lg:px-4 xl:px-7 2xl:px-10 mx-auto bg-primary text-white py-3 shrink-0">  {/* ✅ flex-shrink-0 */}
        <div className="text-center">
          Copyright © 2026 HomeFit 
        </div>
      </footer>
    </div>
  );
}