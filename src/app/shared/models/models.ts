// ── Auth ──────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

// ── User ──────────────────────────────────────────────────────────
export interface UserResponse {
  userId: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: string;
}

// ── Citizen ───────────────────────────────────────────────────────
export interface CitizenRequest {
  userId: number;
  name: string;
  dob?: string;
  gender?: string;
  address?: string;
  contactInfo?: string;
}

export interface CitizenResponse {
  citizenId: number;
  userId: number;
  name: string;
  dob: string;
  gender: string;
  address: string;
  contactInfo: string;
  status: string;
}

// ── Document ──────────────────────────────────────────────────────
export interface DocumentRequest {
  docType: string;
  fileUri: string;
}

export interface DocumentResponse {
  documentId: number;
  docType: string;
  fileUri: string;
  uploadedDate: string;
  verificationStatus: string;
}

// ── Case ──────────────────────────────────────────────────────────
export interface CaseRequest {
  citizenId: number;
  lawyerId?: number;
  title: string;
  description?: string;
}

export interface CaseResponse {
  caseId: number;
  citizenId: number;
  citizenName: string;
  lawyerId: number;
  lawyerName: string;
  judgeId: number;
  judgeName: string;
  title: string;
  description: string;
  filedDate: string;
  status: string;
}

// ── Hearing ───────────────────────────────────────────────────────
export interface HearingRequest {
  caseId: number;
  judgeId: number;
  date: string;
  time: string;
}

export interface HearingResponse {
  hearingId: number;
  caseId: number;
  caseTitle: string;
  judgeId: number;
  judgeName: string;
  date: string;
  time: string;
  status: string;
}

export interface ProceedingRequest {
  hearingId: number;
  notes: string;
  status: string;
}

export interface ProceedingResponse {
  proceedingId: number;
  hearingId: number;
  notes: string;
  date: string;
  status: string;
}

// ── Judgment ──────────────────────────────────────────────────────
export interface JudgmentRequest {
  caseId: number;
  judgeId: number;
  summary: string;
}

export interface JudgmentResponse {
  judgmentId: number;
  caseId: number;
  caseTitle: string;
  judgeId: number;
  judgeName: string;
  summary: string;
  date: string;
  status: string;
}

export interface CourtOrderRequest {
  caseId: number;
  judgeId: number;
  description: string;
}

export interface CourtOrderResponse {
  orderId: number;
  caseId: number;
  caseTitle: string;
  judgeId: number;
  judgeName: string;
  description: string;
  date: string;
  status: string;
}

// ── Compliance ────────────────────────────────────────────────────
export interface ComplianceRecordRequest {
  entityId: number;
  type: string;
  result: string;
  notes?: string;
}

export interface ComplianceRecordResponse {
  complianceId: number;
  entityId: number;
  type: string;
  result: string;
  date: string;
  notes: string;
}

export interface AuditRequest {
  officerId: number;
  scope: string;
  findings?: string;
}

export interface AuditResponse {
  auditId: number;
  officerId: number;
  officerName: string;
  scope: string;
  findings: string;
  date: string;
  status: string;
}

// ── Report ────────────────────────────────────────────────────────
export interface ReportRequest {
  scope: string;
  generatedBy: number;
}

export interface ReportResponse {
  reportId: number;
  scope: string;
  metrics: string;
  generatedDate: string;
  generatedBy: number;
}

// ── Notification ──────────────────────────────────────────────────
export interface NotificationRequest {
  userId: number;
  entityId?: number;
  message: string;
  category: string;
}

export interface NotificationResponse {
  notificationId: number;
  userId: number;
  entityId: number;
  message: string;
  category: string;
  status: string;
  createdDate: string;
  messagingThreadId?: number;
  senderRole?: string;
}
// ── AuditLog ──────────────────────────────────────────────────────
export interface AuditLogResponse {
  auditLogId: number;
  userId: number;
  action: string;
  resource: string;
  timestamp: string;
}
