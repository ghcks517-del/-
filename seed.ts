import { getDb } from "./server/firebase.js";
import { collection, writeBatch, doc } from "firebase/firestore";

const db = getDb();

const data = [
  { lawName: "산업안전보건법", responsibleAgency: "고용노동부", regulationType: "LAW" },
  { lawName: "산업안전보건 기준에 관한 규칙", responsibleAgency: "고용노동부", regulationType: "MINISTERIAL" },
  { lawName: "위험물안전관리법", responsibleAgency: "소방청", regulationType: "LAW" },
  { lawName: "소방시설 설치 및 관리에 관한 법률", responsibleAgency: "소방청", regulationType: "LAW" },
  { lawName: "화재의 예방 및 안전관리에 관한 법률", responsibleAgency: "소방청", regulationType: "LAW" },
  { lawName: "화재안전성능기준", responsibleAgency: "소방청", regulationType: "ADMIN_RULE" },
  { lawName: "도시가스사업법", responsibleAgency: "산업통상부", regulationType: "LAW" },
  { lawName: "고압가스 안전관리법", responsibleAgency: "산업통상부", regulationType: "LAW" },
  { lawName: "전기안전관리법", responsibleAgency: "산업통상부", regulationType: "LAW" },
  { lawName: "건설기계관리법", responsibleAgency: "국토교통부", regulationType: "LAW" },
  { lawName: "건설기술진흥법", responsibleAgency: "국토교통부", regulationType: "LAW" },
  { lawName: "소방기본법", responsibleAgency: "소방청", regulationType: "LAW" },
  { lawName: "응급의료에 관한 법률", responsibleAgency: "보건복지부", regulationType: "LAW" },
  { lawName: "중대재해 처벌 등에 관한 법률", responsibleAgency: "법무부 등 6기관", regulationType: "LAW" },
  { lawName: "대기환경보전법", responsibleAgency: "기후에너지환경부", regulationType: "LAW" },
  { lawName: "물환경보전법", responsibleAgency: "기후에너지환경부", regulationType: "LAW" },
  { lawName: "폐기물관리법", responsibleAgency: "기후에너지환경부", regulationType: "LAW" },
  { lawName: "자원의 절약과 재활용촉진에 관한 법률", responsibleAgency: "기후에너지환경부", regulationType: "LAW" },
  { lawName: "건설폐기물의 재활용 촉진에 관한 법률", responsibleAgency: "기후에너지환경부", regulationType: "LAW" },
  { lawName: "잔류성오염물질 관리법", responsibleAgency: "기후에너지환경부", regulationType: "LAW" },
  { lawName: "먹는물 수질기준 및 검사 등에 관한 규칙", responsibleAgency: "기후에너지환경부", regulationType: "MINISTERIAL" },
  { lawName: "수도법", responsibleAgency: "기후에너지환경부", regulationType: "LAW" },
  { lawName: "하수도법", responsibleAgency: "기후에너지환경부", regulationType: "LAW" },
  { lawName: "먹는물관리법", responsibleAgency: "기후에너지환경부", regulationType: "LAW" },
  { lawName: "지하수법", responsibleAgency: "기후에너지환경부", regulationType: "LAW" },
  { lawName: "화학물질관리법", responsibleAgency: "기후에너지환경부", regulationType: "LAW" },
  { lawName: "토양환경보전법", responsibleAgency: "기후에너지환경부", regulationType: "LAW" },
  { lawName: "소음·진동관리법", responsibleAgency: "기후에너지환경부", regulationType: "LAW" },
  { lawName: "악취방지법", responsibleAgency: "기후에너지환경부", regulationType: "LAW" },
  { lawName: "순환경제사회 전환 촉진법", responsibleAgency: "기후에너지환경부", regulationType: "LAW" },
  { lawName: "에너지이용 합리화법", responsibleAgency: "산업통상부", regulationType: "LAW" },
  { lawName: "기후위기 대응을 위한 탄소중립·녹색성장 기본법", responsibleAgency: "기후에너지환경부", regulationType: "LAW" },
  { lawName: "기업활동 규제완화에 관한 특별조치법", responsibleAgency: "산업통상부", regulationType: "LAW" }
];

async function run() {
  const batch = writeBatch(db);
  for (const item of data) {
    const ref = doc(collection(db, "regulations"));
    batch.set(ref, {
      ...item,
      sourceLawId: "",
      searchKeyword: "",
      defaultDepartments: [],
      defaultNote: "",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastCheckedAt: null,
      lastSuccessfulCheckedAt: null,
    });
  }
  await batch.commit();
  console.log("Seeding complete!");
}

run().catch(console.error);
