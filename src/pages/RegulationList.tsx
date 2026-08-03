import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, X } from "lucide-react";
import { api } from "../api";
import { Regulation, REGULATION_TYPE_LABELS } from "../types";

export default function RegulationList() {
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<Partial<Regulation> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadRegulations();
  }, []);

  const loadRegulations = async () => {
    try {
      const data = await api.regulations.list();
      setRegulations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("정말로 삭제하시겠습니까?")) {
      await api.regulations.delete(id);
      loadRegulations();
    }
  };

  const handleSave = async () => {
    if (!editingReg?.lawName) {
      alert("법규명을 입력해주세요.");
      return;
    }
    
    setIsSaving(true);
    try {
      if (editingReg.id) {
        await api.regulations.update(editingReg.id, editingReg);
      } else {
        await api.regulations.create(editingReg);
      }
      setIsModalOpen(false);
      loadRegulations();
    } catch (err) {
      console.error(err);
      alert("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRegulations = regulations.filter((r) => {
    const matchSearch = r.lawName.includes(search) || (r.searchKeyword || "").includes(search);
    const matchType = typeFilter === "ALL" || r.regulationType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      {/* ... previous code header ... */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">법규 관리</h1>
          <p className="text-sm text-slate-500 mt-1">모니터링 대상 법규를 등록하고 관리합니다.</p>
        </div>
        <button
          onClick={() => {
            setEditingReg({ active: true, regulationType: "LAW", defaultDepartments: [], defaultNote: "" });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          법규 추가
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-slate-200 flex gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="법규명 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">전체 유형</option>
            {Object.entries(REGULATION_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">법규명</th>
                <th className="px-6 py-3 font-medium">유형</th>
                <th className="px-6 py-3 font-medium">소관 기관</th>
                <th className="px-6 py-3 font-medium">상태</th>
                <th className="px-6 py-3 font-medium">최종 확인일</th>
                <th className="px-6 py-3 font-medium text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : filteredRegulations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    등록된 법규가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredRegulations.map((reg) => (
                  <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{reg.lawName}</td>
                    <td className="px-6 py-4">{REGULATION_TYPE_LABELS[reg.regulationType]}</td>
                    <td className="px-6 py-4">{reg.responsibleAgency || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${reg.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                        {reg.active ? '사용' : '미사용'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{reg.lastCheckedAt ? new Date(reg.lastCheckedAt).toLocaleDateString() : "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => { setEditingReg(reg); setIsModalOpen(true); }}
                        className="text-blue-600 hover:text-blue-800 p-1 mx-1"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(reg.id)} className="text-red-600 hover:text-red-800 p-1 mx-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && editingReg && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">{editingReg.id ? "법규 수정" : "새 법규 등록"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">법규명 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={editingReg.lawName || ""} 
                  onChange={(e) => setEditingReg({ ...editingReg, lawName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  placeholder="예: 산업안전보건법"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">법규 유형</label>
                  <select 
                    value={editingReg.regulationType || "LAW"}
                    onChange={(e) => setEditingReg({ ...editingReg, regulationType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  >
                    {Object.entries(REGULATION_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">소관 기관</label>
                  <input 
                    type="text" 
                    value={editingReg.responsibleAgency || ""} 
                    onChange={(e) => setEditingReg({ ...editingReg, responsibleAgency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API 식별값 (선택)</label>
                <input 
                  type="text" 
                  value={editingReg.sourceLawId || ""} 
                  onChange={(e) => setEditingReg({ ...editingReg, sourceLawId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  placeholder="국가법령정보 API 법령ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">기본 관련 부서</label>
                <input 
                  type="text" 
                  value={(editingReg.defaultDepartments || []).join(", ")} 
                  onChange={(e) => setEditingReg({ ...editingReg, defaultDepartments: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  placeholder="예: 안전환경팀, 인사팀 (쉼표 구분)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">사용 여부</label>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={editingReg.active !== false}
                    onChange={(e) => setEditingReg({ ...editingReg, active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 mr-2"
                  />
                  <span className="text-sm text-slate-700">모니터링 활성화</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50"
              >
                취소
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
