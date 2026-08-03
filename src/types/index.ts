export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  lastLoginAt: string;
}

export interface Regulation {
  id: string;
  sourceLawId: string;
  lawName: string;
  regulationType: "LAW" | "PRESIDENTIAL" | "MINISTERIAL" | "ADMIN_RULE" | "LOCAL_RULE" | "OTHER";
  searchKeyword: string;
  responsibleAgency: string;
  defaultDepartments: string[];
  defaultNote: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastCheckedAt: string | null;
  lastSuccessfulCheckedAt: string | null;
}

export interface Revision {
  id: string;
  regulationId: string;
  sourceLawId: string;
  revisionId: string;
  lawName: string;
  promulgationDate: string | null; // YYYY-MM-DD
  enforcementDate: string | null; // YYYY-MM-DD
  revisionType: string | null;
  beforeText: string;
  afterText: string;
  diffData: string; // JSON string or structured data
  aiSummary: AISummary | null;
  departments: string[];
  note: string;
  reviewStatus: "NEW" | "REVIEWING" | "COMPLETED" | "NO_ACTION_NEEDED" | "RECHECK_NEEDED";
  reviewer: string | null;
  reviewedAt: string | null;
  sourceUrl: string | null;
  collectedAt: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface AISummary {
  summary: string;
  addedObligations: string[];
  removedObligations: string[];
  changedRequirements: string[];
  reviewPoints: string[];
  departmentCheckpoints: string[];
}

export interface SyncRun {
  id: string;
  triggerType: "MANUAL" | "AUTO";
  targetYear?: number;
  targetMonth?: number;
  startedAt: string;
  completedAt: string | null;
  status: "RUNNING" | "COMPLETED" | "PARTIAL_SUCCESS" | "FAILED";
  totalCount: number;
  changedCount: number;
  unchangedCount: number;
  successCount: number;
  failedCount: number;
  errorSummary: string | null;
}

export interface SyncRunItem {
  id: string;
  syncRunId: string;
  regulationId: string;
  status: "SUCCESS" | "UNCHANGED" | "FAILED";
  revisionCount: number;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  beforeData: string | null;
  afterData: string | null;
  createdAt: string;
}

export const REGULATION_TYPE_LABELS: Record<string, string> = {
  LAW: "법률",
  PRESIDENTIAL: "대통령령",
  MINISTERIAL: "총리령·부령",
  ADMIN_RULE: "행정규칙",
  LOCAL_RULE: "자치법규",
  OTHER: "기타",
};

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  NEW: "신규",
  REVIEWING: "검토 중",
  COMPLETED: "검토 완료",
  NO_ACTION_NEEDED: "조치 불필요",
  RECHECK_NEEDED: "재확인 필요",
};
