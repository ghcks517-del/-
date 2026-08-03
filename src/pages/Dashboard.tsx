import { useState, useEffect } from "react";
import { Book, RefreshCw, FileText, CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
        <p className="text-sm text-slate-500 mt-1">최근 법규 개정 현황 및 동기화 상태를 요약합니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="등록 법규" value="42" icon={Book} color="blue" />
        <StatCard title="이번 달 개정 건수" value="3" icon={RefreshCw} color="green" />
        <StatCard title="시행 예정 법규" value="5" icon={Clock} color="amber" />
        <StatCard title="미검토 항목" value="12" icon={AlertCircle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            최근 개정 법규
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="font-medium text-slate-900 text-sm">산업안전보건법 시행규칙</p>
              <p className="text-xs text-slate-500 mt-1">공포일: 2026-07-28 | 시행일: 2026-08-01</p>
            </div>
            <div className="border-l-4 border-amber-500 pl-4 py-2">
              <p className="font-medium text-slate-900 text-sm">개인정보 보호법 시행령</p>
              <p className="text-xs text-slate-500 mt-1">공포일: 2026-07-15 | 시행일: 2026-09-15</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-slate-400" />
            시스템 상태
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">마지막 수집 일시</span>
              <span className="text-sm font-medium text-slate-900">2026-07-01 09:00</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">다음 수집 예정일</span>
              <span className="text-sm font-medium text-slate-900">2026-08-01 09:00</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-600">최근 실행 결과</span>
              <span className="text-sm font-medium text-green-600">성공</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
              <button className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">
                전체 법규 지금 확인
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  }[color as string] || "bg-slate-50 text-slate-600";

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center">
      <div className={`p-4 rounded-full mr-4 ${colorClasses}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}
