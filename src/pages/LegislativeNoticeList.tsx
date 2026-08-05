import { useState, useEffect } from "react";
import { Search, ExternalLink, Calendar, Building2, Trash2 } from "lucide-react";
import { LegislativeNotice } from "../types";

export default function LegislativeNoticeList() {
  const [notices, setNotices] = useState<LegislativeNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | "ALL">("ALL");
  const [selectedMonth, setSelectedMonth] = useState<number | "ALL">("ALL");

  useEffect(() => {
    const loadNotices = async () => {
      setLoading(true);
      try {
        const data = await fetch("/api/legislative-notices").then(r => r.json());
        if (Array.isArray(data)) {
          setNotices(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadNotices();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("이 입법예고를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/legislative-notices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotices(notices.filter(n => n.id !== id));
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const filteredNotices = notices.filter(notice => {
    if (searchKeyword && !notice.title.toLowerCase().includes(searchKeyword.toLowerCase())) {
      return false;
    }
    if (selectedYear !== "ALL" || selectedMonth !== "ALL") {
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
      if (selectedYear !== "ALL" && y !== String(selectedYear)) return false;
      if (selectedMonth !== "ALL" && parseInt(m, 10) !== selectedMonth) return false;
    }
    return true;
  }).sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div className="p-8 max-w-7xl mx-auto flex h-full gap-6 flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">입법예고</h1>
          <p className="text-sm text-slate-500 mt-1">수집된 입법예고 및 행정예고 사항을 확인합니다.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="입법예고 법령명 검색" 
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm"
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
          />
        </div>
        <select 
          className="border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 bg-white"
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))}
        >
          <option value="ALL">연도 전체</option>
          {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
            <option key={year} value={year}>{year}년</option>
          ))}
        </select>
        <select 
          className="border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 bg-white"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))}
        >
          <option value="ALL">월 전체</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
            <option key={month} value={month}>{month}월</option>
          ))}
        </select>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-8 text-center text-slate-500">로딩 중...</div>
        ) : filteredNotices.length === 0 ? (
          <div className="p-8 text-center text-slate-500">조건에 맞는 입법예고가 없습니다.</div>
        ) : (
          <div className="overflow-y-auto p-0 m-0">
            {filteredNotices.map(notice => (
              <div key={notice.id} className="p-6 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-slate-900 pr-4">{notice.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 whitespace-nowrap flex-shrink-0">
                      {notice.status}
                    </span>
                    <button 
                      onClick={() => handleDelete(notice.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {notice.department}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> 예고기간: {notice.startDate} ~ {notice.endDate}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap mb-4">
                  {notice.content}
                </div>
                <div className="flex justify-end">
                  <a 
                    href={notice.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    상세보기
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
