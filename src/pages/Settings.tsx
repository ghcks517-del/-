export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">설정</h1>
        <p className="text-sm text-slate-500 mt-1">시스템 동작 및 API 연동을 설정합니다.</p>
      </div>

      <div className="mt-8 space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">API 연결 상태</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-700">국가법령정보 API</p>
                <p className="text-sm text-slate-500">법령 정보 수집에 사용됩니다.</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">연결됨</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-700">Gemini AI</p>
                <p className="text-sm text-slate-500">법규 개정 내용 요약에 사용됩니다.</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">연결됨</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-slate-700">Cloud Scheduler</p>
                <p className="text-sm text-slate-500">매월 자동 수집 스케줄러.</p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">설정 확인 필요</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">자동 수집 설정</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">자동 수집 사용</label>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">실행 일정</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                <option>매월 1일 오전 09:00</option>
                <option>매월 1일 자정</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            설정 저장
          </button>
        </div>
      </div>
    </div>
  );
}
