import { useState, useEffect } from "react";
import { Book, RefreshCw, FileText, CheckCircle, AlertCircle, Clock, Download, X } from "lucide-react";
import { ExcelExportService } from "../services/ExcelExportService";
import { Revision, LegislativeNotice } from "../types";

export default function Dashboard() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportYear, setExportYear] = useState<number | "ALL">(new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState<number | "ALL">("ALL");
  const [exportRevisions, setExportRevisions] = useState(true);
  const [exportNotices, setExportNotices] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!exportRevisions && !exportNotices) {
      alert("다운로드할 항목(개정 내역 또는 입법 예고)을 선택해주세요.");
      return;
    }

    try {
      setIsExporting(true);
      let revisionsData: Revision[] = [];
      let noticesData: LegislativeNotice[] = [];

      let queryParams = `?year=${exportYear}`;
      if (exportMonth !== "ALL") {
        queryParams += `&month=${exportMonth}`;
      }

      if (exportRevisions) {
        const revRes = await fetch(`/api/revisions`);
        if (revRes.ok) {
          const allRevs = await revRes.json();
          revisionsData = allRevs.filter((rev: any) => {
             const dateStr = rev.promulgationDate;
             if (!dateStr) return false;
             let y, m;
             if (dateStr.includes("-")) {
                 [y, m] = dateStr.split("-");
             } else if (dateStr.length === 8) {
                 y = dateStr.substring(0, 4);
                 m = dateStr.substring(4, 6);
             } else {
                 return false;
             }
             if (exportYear !== "ALL" && y !== String(exportYear)) return false;
             if (exportMonth !== "ALL" && parseInt(m, 10) !== exportMonth) return false;
             return true;
          });
        }
      }

      if (exportNotices) {
        const notRes = await fetch(`/api/legislative-notices`);
        if (notRes.ok) {
          const allNotices = await notRes.json();
          noticesData = allNotices.filter((notice: any) => {
             const dateStr = notice.startDate;
             if (!dateStr) return false;
             let y, m;
             if (dateStr.includes("-")) {
                 [y, m] = dateStr.split("-");
             } else if (dateStr.length >= 8) {
                 y = dateStr.substring(0, 4);
                 m = dateStr.substring(4, 6);
             } else {
                 return false;
             }
             if (exportYear !== "ALL" && y !== String(exportYear)) return false;
             if (exportMonth !== "ALL" && parseInt(m, 10) !== exportMonth) return false;
             return true;
          });
        }
      }

      if (revisionsData.length === 0 && noticesData.length === 0) {
        alert("선택한 조건에 해당하는 데이터가 없습니다.");
        return;
      }

      await ExcelExportService.exportRevisions(revisionsData, noticesData);
      setShowExportModal(false);
    } catch (e) {
      console.error(e);
      alert("엑셀 다운로드 중 오류가 발생했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
          <p className="text-sm text-slate-500 mt-1">최근 법규 개정 현황 및 동기화 상태를 요약합니다.</p>
        </div>
        <button 
          onClick={() => setShowExportModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm"
        >
          <Download className="w-4 h-4" />
          엑셀 다운로드
        </button>
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
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-600" />
                엑셀 다운로드
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">기간 선택</label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                    value={exportYear}
                    onChange={(e) => setExportYear(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))}
                  >
                    <option value="ALL">연도 전체</option>
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}년</option>
                    ))}
                  </select>
                  <select 
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))}
                  >
                    <option value="ALL">월 전체</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{m}월</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-sm font-medium text-slate-700">다운로드 항목</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={exportRevisions}
                      onChange={(e) => setExportRevisions(e.target.checked)}
                    />
                    <span className="text-sm text-slate-700">개정 내역</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={exportNotices}
                      onChange={(e) => setExportNotices(e.target.checked)}
                    />
                    <span className="text-sm text-slate-700">입법 예고</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button 
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
              >
                취소
              </button>
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isExporting ? "다운로드 중..." : "다운로드"}
              </button>
            </div>
          </div>
        </div>
      )}
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
