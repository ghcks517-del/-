import { useState, useEffect } from "react";
import { Play, X, Trash2 } from "lucide-react";
import { api } from "../api";
import { SyncRun } from "../types";

export default function SyncHistory() {
  const [running, setRunning] = useState(false);
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  useEffect(() => {
    const loadRuns = async () => {
      try {
        const data = await fetch("/api/sync-runs").then(r => r.json());
        if (Array.isArray(data)) {
            setRuns(data);
        }
      } catch(e) {
          console.error(e);
      }
    };
    loadRuns();
    const interval = setInterval(loadRuns, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);


  const handleDeleteRun = async (id: string) => {
    if (!confirm("이 실행 이력을 삭제하시겠습니까? 관련 항목들도 함께 삭제됩니다.")) return;
    try {
      await api.sync.deleteRun(id);
      setRuns(runs.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleManualSync = async () => {
    setShowPopup(false);
    setRunning(true);
    try {
      await api.sync.runMonthly(selectedYear, selectedMonth);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">수집 실행 이력</h1>
          <p className="text-sm text-slate-500 mt-1">자동 및 수동으로 실행된 법규 수집 작업의 결과를 확인합니다.</p>
        </div>
        <button 
          onClick={() => setShowPopup(true)}
          disabled={running}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium text-sm disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          {running ? "실행 중..." : "전체 지금 확인"}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        {runs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            수집 실행 이력이 없습니다.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">시작 일시</th>
                <th className="px-6 py-3 font-medium">실행 유형</th>
                <th className="px-6 py-3 font-medium">기준 연월</th>
                <th className="px-6 py-3 font-medium">상태</th>
                <th className="px-6 py-3 font-medium">검토 대상 수</th>
                <th className="px-6 py-3 font-medium">개정 발견</th>
                <th className="px-6 py-3 font-medium">오류</th>
                <th className="px-6 py-3 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <tr key={run.id} className="border-b border-slate-100 hover:bg-slate-50">
                   <td className="px-6 py-4">{new Date(run.startedAt).toLocaleString()}</td>
                   <td className="px-6 py-4">{run.triggerType === "AUTO" ? "스케줄" : "수동"}</td>
                   <td className="px-6 py-4 font-medium text-slate-700">
                     {run.targetYear ? `${run.targetYear}년 ${run.targetMonth}월` : "-"}
                   </td>
                   <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded text-xs font-bold ${
                         run.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                         run.status === "RUNNING" ? "bg-blue-100 text-blue-800" :
                         run.status === "FAILED" ? "bg-red-100 text-red-800" :
                         "bg-amber-100 text-amber-800"
                     }`}>
                         {run.status}
                     </span>
                   </td>
                   <td className="px-6 py-4">{run.totalCount}</td>
                   <td className="px-6 py-4 font-semibold text-blue-600">{run.changedCount}</td>
                   <td className="px-6 py-4 text-red-600">{run.failedCount}</td>
                   <td className="px-6 py-4">
                     <button
                       onClick={() => handleDeleteRun(run.id)}
                       className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                       title="이력 삭제"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-96 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">수집 기준 연월 선택</h2>
              <button onClick={() => setShowPopup(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-6">
              선택한 연도와 월의 <strong>공포일자</strong>를 기준으로 법규 개정 사항을 수집합니다.
            </p>

            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">연도</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value))}
                >
                  {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
                    <option key={year} value={year}>{year}년</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">월</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(parseInt(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>{month}월</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50"
              >
                취소
              </button>
              <button 
                onClick={handleManualSync}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                수집 시작
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
