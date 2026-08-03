/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createBrowserRouter, RouterProvider, Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Book, History, Settings as SettingsIcon, FileText, Download } from "lucide-react";
import clsx from "clsx";
import Dashboard from "./pages/Dashboard";
import RegulationList from "./pages/RegulationList";
import RevisionHistory from "./pages/RevisionHistory";
import SyncHistory from "./pages/SyncHistory";
import SettingsPage from "./pages/Settings";

const Sidebar = () => {
  const location = useLocation();
  const navItems = [
    { name: "대시보드", path: "/", icon: LayoutDashboard },
    { name: "법규 관리", path: "/regulations", icon: Book },
    { name: "개정 내역", path: "/revisions", icon: FileText },
    { name: "수집 실행 이력", path: "/sync-history", icon: History },
    { name: "설정", path: "/settings", icon: SettingsIcon },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Book className="w-6 h-6 text-blue-400" />
          법규 개정 모니터링
        </h1>
      </div>
      <nav className="flex-1 mt-6 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
              <span className="text-sm font-medium">관리자</span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">관리자 (ADMIN)</p>
            <p className="text-xs text-slate-400">admin@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TopNav = () => {
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center text-sm">
        <div className="flex items-center text-slate-500 mr-6">
          <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
          법령 API: 연결 확인 중
        </div>
        <div className="flex items-center text-slate-500">
          마지막 동기화: -
        </div>
      </div>
      <div className="flex items-center">
        <button className="text-sm text-slate-500 hover:text-slate-700">로그아웃</button>
      </div>
    </header>
  );
};

const Layout = () => {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "regulations", element: <RegulationList /> },
      { path: "revisions", element: <RevisionHistory /> },
      { path: "sync-history", element: <SyncHistory /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
