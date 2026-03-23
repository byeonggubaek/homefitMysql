// src/layouts/MainLayout.jsx
import type { NavItem } from 'shared';
import { Link, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import WdogNavi from '@/components/WdogNavi'
import WdogMenuSearch from '@/components/WdogMenuSearch'
import WdogAvatar from '@/components/WdogAvatar';

export default function MainLayout() {
  const isDarkMode = useDarkMode(); // 훅 호출
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  useEffect(() => {
    fetch('http://localhost:3001/api/get_menus')
      .then(res => res.json())
      .then(data => {
        setNavItems(data.data);  // 👈 바로 사용!
      });
  }, []);
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log('Storage 변경 감지:', e.key, e.newValue);
      if (e.key === 'memberID') {
        console.log('memberID 변경 감지:', e.newValue);
        const newID = e.newValue;
        if (newID) setMemberID(newID);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  const [memberID, setMemberID] = useState("");
  // 1. 초기 로드
  useEffect(() => {
    console.log('초기 한번만 실행되야 되는데');
    localStorage.setItem("memberID", ""); // 초기화
  }, []);
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
          <div className="w-1/6">
            <WdogMenuSearch />
          </div>
          <div className="w-5">
            <WdogAvatar memberID={memberID} />
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