import fs from 'fs';
let content = fs.readFileSync('server/services/SyncService.ts', 'utf-8');

const mockTarget = `      // ===== 수집: 입법예고 (MOCK DATA) =====
      try {
        const yyyy = targetYear || new Date().getFullYear();
        const mm = String(targetMonth || (new Date().getMonth() + 1)).padStart(2, "0");
        const startDatePrefix = \`\${yyyy}-\${mm}\`;
        
        // 목업 데이터 생성 (실제 환경에서는 API 호출)
        const mockNotices = [
          {
            noticeId: \`notice-\${yyyy}\${mm}-01\`,
            title: \`산업안전보건법 일부개정법률안 입법예고 (Mock \${yyyy}-\${mm})\`,
            department: "고용노동부",
            startDate: \`\${startDatePrefix}-05\`,
            endDate: \`\${startDatePrefix}-25\`,
            content: \`1. 개정이유\n중대재해 예방을 위한 사업주 의무를 명확히 하고, 현행 제도의 운영상 나타난 일부 미비점을 개선ㆍ보완하여 산업현장의 안전보건 관리를 실질적으로 강화하려는 것임.\n\n2. 주요내용\n가. 사업주 의무 강화 (안 제00조)\n  - 위험성평가 결과에 따른 안전보건조치 의무 명확화\n나. 과태료 상향 (안 제00조)\n  - 안전보건관리책임자 미선임 시 과태료 상향 조정\n다. 근로자 작업중지권 실효성 확보 (안 제00조)\n  - 작업중지 시 불이익 처우 금지 규정 구체화\`,
            status: "진행중",
            sourceUrl: "https://www.lawmaking.go.kr/",
            collectedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          },
          {
            noticeId: \`notice-\${yyyy}\${mm}-02\`,
            title: \`화학물질관리법 시행령 일부개정령안 입법예고 (Mock \${yyyy}-\${mm})\`,
            department: "환경부",
            startDate: \`\${startDatePrefix}-10\`,
            endDate: \`\${startDatePrefix}-30\`,
            content: \`1. 개정이유\n유해화학물질 취급 기준을 명확히 하고, 화학사고 예방을 위해 관리자의 교육 이수 의무 시간을 확대하는 등 현행 법령의 미비점을 개선하려는 것임.\n\n2. 주요내용\n가. 유해화학물질 취급 기준 명확화 (안 제00조)\n  - 취급 시설의 정기검사 주기 차등화\n나. 관리자 교육 이수 의무 시간 확대 (안 제00조)\n  - 기술인력 및 유해화학물질 관리자 안전교육 이수 시간 확대 (기존 16시간 -> 32시간)\n다. 화학사고 발생 시 신고 절차 간소화 (안 제00조)\`,
            status: "진행중",
            sourceUrl: "https://www.lawmaking.go.kr/",
            collectedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          }
        ];
        
        // 필터링: 등록된 법규명(activeRegs)에 해당하는 입법예고만 추출
        const filteredNotices = mockNotices.filter(notice => 
          activeRegs.some(reg => notice.title.includes(reg.lawName))
        );`;

const newCode = `      // ===== 수집: 입법예고 (API or MOCK Fallback) =====
      try {
        const yyyy = targetYear || new Date().getFullYear();
        const mm = String(targetMonth || (new Date().getMonth() + 1)).padStart(2, "0");
        
        let fetchedNotices: any[] = [];
        const dataApiKey = process.env.DATA_GO_KR_API_KEY;
        
        if (dataApiKey) {
            try {
                // 실제 공공데이터포털 입법예고 API 연동 (국민참여입법센터 입법예고 목록)
                const axios = require('axios');
                const { parseStringPromise } = require('xml2js');
                
                const res = await axios.get("http://apis.data.go.kr/1130000/MllwnoLrsrcInfoService/getMllwnoLrsrcInfoList", {
                    params: { serviceKey: decodeURIComponent(dataApiKey), pageNo: 1, numOfRows: 100 }
                });
                const parsed = await parseStringPromise(res.data);
                
                if (parsed.response && parsed.response.body && parsed.response.body[0].items && parsed.response.body[0].items[0].item) {
                    const items = parsed.response.body[0].items[0].item;
                    fetchedNotices = items.map((item: any) => ({
                        noticeId: \`notice-\${item.pbancNo?.[0] || Math.random()}\`,
                        title: item.lrsrcNm?.[0] || "",
                        department: item.chrscDptNm?.[0] || "",
                        startDate: item.pbancBgngYmd?.[0] || "",
                        endDate: item.pbancEndYmd?.[0] || "",
                        content: item.ntceMainCn?.[0] || "상세내용 참고",
                        status: "입법예고",
                        sourceUrl: item.url?.[0] || "https://opinion.lawmaking.go.kr",
                        collectedAt: new Date().toISOString(),
                        createdAt: new Date().toISOString()
                    }));
                }
            } catch (apiErr: any) {
                console.error("공공데이터포털 API 연동 실패 (Fallback Mock 사용):", apiErr.message);
            }
        }
        
        if (fetchedNotices.length === 0) {
            // API 키가 없거나 연동 실패 시, 사용자의 구독 법령(activeRegs) 기반으로 동적 Mock 데이터 생성
            console.log("Using dynamic mock data for legislative notices...");
            const startDatePrefix = \`\${yyyy}-\${mm}\`;
            
            fetchedNotices = activeRegs.map((reg, idx) => ({
                noticeId: \`notice-\${yyyy}\${mm}-\${idx}\`,
                title: \`\${reg.lawName} 일부개정법률안 입법예고 (Mock)\`,
                department: "관할부처",
                startDate: \`\${startDatePrefix}-\${String((idx % 28) + 1).padStart(2, '0')}\`,
                endDate: \`\${startDatePrefix}-\${String(((idx + 14) % 28) + 1).padStart(2, '0')}\`,
                content: \`1. 개정이유\n현행 \${reg.lawName}의 운영상 나타난 일부 미비점을 개선ㆍ보완하려는 것임.\n\n2. 주요내용\n가. 주요 규제 완화 또는 기준 명확화\n나. 과태료 등 제재 규정 정비\`,
                status: "진행중",
                sourceUrl: "https://www.lawmaking.go.kr/",
                collectedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
            }));
        }

        // 필터링: 등록된 법규명(activeRegs)에 해당하는 입법예고만 추출
        const filteredNotices = fetchedNotices.filter(notice => 
          activeRegs.some(reg => notice.title.includes(reg.lawName))
        );`;

if(content.includes('// ===== 수집: 입법예고 (MOCK DATA) =====')) {
    content = content.replace(mockTarget, newCode);
    fs.writeFileSync('server/services/SyncService.ts', content);
    console.log("Patched SyncService.ts");
} else {
    console.log("Could not find target block in SyncService.ts");
}
