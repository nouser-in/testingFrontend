import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  UserResponse, CitizenRequest, CitizenResponse, DocumentRequest, DocumentResponse,
  CaseRequest, CaseResponse, HearingRequest, HearingResponse, ProceedingRequest, ProceedingResponse,
  JudgmentRequest, JudgmentResponse, CourtOrderRequest, CourtOrderResponse,
  ComplianceRecordRequest, ComplianceRecordResponse, AuditRequest, AuditResponse,
  ReportRequest, ReportResponse, NotificationRequest, NotificationResponse, AuditLogResponse
} from '../../shared/models/models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class UserApiService {
  constructor(private http: HttpClient) { }
  getAll(): Observable<UserResponse[]> { return this.http.get<UserResponse[]>(`${API}/users`); }
  getById(id: number): Observable<UserResponse> { return this.http.get<UserResponse>(`${API}/users/${id}`); }

  getByRole(role: string): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${API}/users/role/${role.toUpperCase()}`);
  }

  updateStatus(id: number, status: string): Observable<UserResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<UserResponse>(`${API}/users/${id}/status`, null, { params });
  }
  updateRole(id: number, role: string): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${API}/users/${id}/change-role`, { role });
  }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${API}/users/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class CitizenApiService {
  constructor(private http: HttpClient) { }
  create(req: CitizenRequest): Observable<CitizenResponse> { return this.http.post<CitizenResponse>(`${API}/citizens`, req); }
  getAll(): Observable<CitizenResponse[]> { return this.http.get<CitizenResponse[]>(`${API}/citizens`); }
  getById(id: number): Observable<CitizenResponse> { return this.http.get<CitizenResponse>(`${API}/citizens/${id}`); }
  getByUserId(userId: number): Observable<CitizenResponse> {
    return this.http.get<CitizenResponse[]>(`${API}/citizens`).pipe(
      map(citizens => {
        const matched = citizens.find(c => c.userId === userId);
        if (!matched) {
          throw new Error('Citizen profile not found for current user');
        }
        return matched;
      })
    );
  }
  update(id: number, req: CitizenRequest): Observable<CitizenResponse> { return this.http.put<CitizenResponse>(`${API}/citizens/${id}`, req); }
  addDocument(id: number, req: DocumentRequest): Observable<DocumentResponse> { return this.http.post<DocumentResponse>(`${API}/citizens/${id}/documents`, req); }
  getDocuments(id: number): Observable<DocumentResponse[]> { return this.http.get<DocumentResponse[]>(`${API}/citizens/${id}/documents`); }
  verifyDocument(citizenId: number, docId: number, status: string): Observable<DocumentResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<DocumentResponse>(`${API}/citizens/${citizenId}/documents/${docId}/verify`, null, { params });
  }
}

@Injectable({ providedIn: 'root' })
export class CaseApiService {
  constructor(private http: HttpClient) { }
  file(req: CaseRequest): Observable<CaseResponse> { return this.http.post<CaseResponse>(`${API}/cases`, req); }
  getAll(): Observable<CaseResponse[]> { return this.http.get<CaseResponse[]>(`${API}/cases`); }
  getById(id: number): Observable<CaseResponse> { return this.http.get<CaseResponse>(`${API}/cases/${id}`); }
  getByCitizen(id: number): Observable<CaseResponse[]> { return this.http.get<CaseResponse[]>(`${API}/cases/citizen/${id}`); }
  getByLawyer(id: number): Observable<CaseResponse[]> { return this.http.get<CaseResponse[]>(`${API}/cases/lawyer/${id}`); }
  getByStatus(status: string): Observable<CaseResponse[]> { return this.http.get<CaseResponse[]>(`${API}/cases/status/${status}`); }
  updateStatus(id: number, status: string): Observable<CaseResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<CaseResponse>(`${API}/cases/${id}/status`, null, { params });
  }
  assignLawyer(caseId: number, lawyerId: number): Observable<CaseResponse> {
    return this.http.patch<CaseResponse>(`${API}/cases/${caseId}/assign-lawyer`, null, { params: { lawyerId: lawyerId.toString() } });
  }
  removeLawyer(caseId: number): Observable<CaseResponse> {
    return this.http.patch<CaseResponse>(`${API}/cases/${caseId}/remove-lawyer`, null);
  }
  assignJudge(caseId: number, judgeId: number): Observable<CaseResponse> {
    return this.http.patch<CaseResponse>(`${API}/cases/${caseId}/assign-judge`, null, { params: { judgeId: judgeId.toString() } });
  }
  addDocument(id: number, req: DocumentRequest): Observable<DocumentResponse> { return this.http.post<DocumentResponse>(`${API}/cases/${id}/documents`, req); }
  getDocuments(id: number): Observable<DocumentResponse[]> { return this.http.get<DocumentResponse[]>(`${API}/cases/${id}/documents`); }
  verifyDocument(caseId: number, docId: number, status: string): Observable<DocumentResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<DocumentResponse>(`${API}/cases/${caseId}/documents/${docId}/verify`, null, { params });
  }
}

@Injectable({ providedIn: 'root' })
export class HearingApiService {
  constructor(private http: HttpClient) { }
  schedule(req: HearingRequest): Observable<HearingResponse> { return this.http.post<HearingResponse>(`${API}/hearings`, req); }
  getAll(): Observable<HearingResponse[]> { return this.http.get<HearingResponse[]>(`${API}/hearings`); }
  getById(id: number): Observable<HearingResponse> { return this.http.get<HearingResponse>(`${API}/hearings/${id}`); }
  getByCase(caseId: number): Observable<HearingResponse[]> { return this.http.get<HearingResponse[]>(`${API}/hearings/case/${caseId}`); }
  getByJudge(judgeId: number): Observable<HearingResponse[]> { return this.http.get<HearingResponse[]>(`${API}/hearings/judge/${judgeId}`); }
  updateStatus(id: number, status: string): Observable<HearingResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<HearingResponse>(`${API}/hearings/${id}/status`, null, { params });
  }
  addProceeding(id: number, req: ProceedingRequest): Observable<ProceedingResponse> { return this.http.post<ProceedingResponse>(`${API}/hearings/${id}/proceedings`, req); }
  getProceedings(id: number): Observable<ProceedingResponse[]> { return this.http.get<ProceedingResponse[]>(`${API}/hearings/${id}/proceedings`); }
}


@Injectable({ providedIn: 'root' })
export class JudgmentApiService {
  constructor(private http: HttpClient) { }
  record(req: JudgmentRequest): Observable<JudgmentResponse> { return this.http.post<JudgmentResponse>(`${API}/judgments`, req); }
  getAll(): Observable<JudgmentResponse[]> { return this.http.get<JudgmentResponse[]>(`${API}/judgments`); }
  getById(id: number): Observable<JudgmentResponse> { return this.http.get<JudgmentResponse>(`${API}/judgments/${id}`); }
  getByCase(caseId: number): Observable<JudgmentResponse[]> { return this.http.get<JudgmentResponse[]>(`${API}/judgments/case/${caseId}`); }
  getByJudge(judgeId: number): Observable<JudgmentResponse[]> { return this.http.get<JudgmentResponse[]>(`${API}/judgments/judge/${judgeId}`); }
  finalize(id: number): Observable<JudgmentResponse> { return this.http.patch<JudgmentResponse>(`${API}/judgments/${id}/finalize`, null); }


  issueOrder(req: CourtOrderRequest): Observable<CourtOrderResponse> { return this.http.post<CourtOrderResponse>(`${API}/court-orders`, req); }
  getAllOrders(): Observable<CourtOrderResponse[]> { return this.http.get<CourtOrderResponse[]>(`${API}/court-orders`); }
  getOrderById(id: number): Observable<CourtOrderResponse> { return this.http.get<CourtOrderResponse>(`${API}/court-orders/${id}`); }
  getOrdersByCase(caseId: number): Observable<CourtOrderResponse[]> { return this.http.get<CourtOrderResponse[]>(`${API}/court-orders/case/${caseId}`); }
  getOrdersByJudge(judgeId: number): Observable<CourtOrderResponse[]> { return this.http.get<CourtOrderResponse[]>(`${API}/court-orders/judge/${judgeId}`); }
  updateOrderStatus(id: number, status: string): Observable<CourtOrderResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<CourtOrderResponse>(`${API}/court-orders/${id}/status`, null, { params });
  }
}

@Injectable({ providedIn: 'root' })
export class ComplianceApiService {
  constructor(private http: HttpClient) { }
  createRecord(req: ComplianceRecordRequest): Observable<ComplianceRecordResponse> { return this.http.post<ComplianceRecordResponse>(`${API}/compliance`, req); }
  getAllRecords(): Observable<ComplianceRecordResponse[]> { return this.http.get<ComplianceRecordResponse[]>(`${API}/compliance`); }
  getRecordById(id: number): Observable<ComplianceRecordResponse> { return this.http.get<ComplianceRecordResponse>(`${API}/compliance/${id}`); }
  updateRecord(id: number, req: any): Observable<ComplianceRecordResponse> { return this.http.patch<ComplianceRecordResponse>(`${API}/compliance/${id}`, req); }

  createAudit(req: AuditRequest): Observable<AuditResponse> { return this.http.post<AuditResponse>(`${API}/audits`, req); }
  getAllAudits(): Observable<AuditResponse[]> { return this.http.get<AuditResponse[]>(`${API}/audits`); }
  getAuditById(id: number): Observable<AuditResponse> { return this.http.get<AuditResponse>(`${API}/audits/${id}`); }
  updateAuditStatus(id: number, status: string): Observable<AuditResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<AuditResponse>(`${API}/audits/${id}/status`, null, { params });
  }
}

@Injectable({ providedIn: 'root' })
export class ReportApiService {
  constructor(private http: HttpClient) { }
  generate(req: ReportRequest): Observable<ReportResponse> { return this.http.post<ReportResponse>(`${API}/reports/generate`, req); }
  getAll(): Observable<ReportResponse[]> { return this.http.get<ReportResponse[]>(`${API}/reports`); }
  getById(id: number): Observable<ReportResponse> { return this.http.get<ReportResponse>(`${API}/reports/${id}`); }
  getByScope(scope: string): Observable<ReportResponse[]> { return this.http.get<ReportResponse[]>(`${API}/reports/scope/${scope}`); }
}

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  constructor(private http: HttpClient) { }
  create(req: NotificationRequest): Observable<NotificationResponse> { return this.http.post<NotificationResponse>(`${API}/notifications`, req); }
  getByUser(userId: number): Observable<NotificationResponse[]> { return this.http.get<NotificationResponse[]>(`${API}/notifications/user/${userId}`); }
  markRead(id: number): Observable<NotificationResponse> { return this.http.patch<NotificationResponse>(`${API}/notifications/${id}/read`, null); }
  markAllRead(userId: number): Observable<void> { return this.http.patch<void>(`${API}/notifications/user/${userId}/read-all`, null); }
  countUnread(userId: number): Observable<number> { return this.http.get<number>(`${API}/notifications/user/${userId}/unread-count`); }
}

@Injectable({ providedIn: 'root' })
export class AuditLogApiService {
  constructor(private http: HttpClient) { }
  getAll(): Observable<AuditLogResponse[]> { return this.http.get<AuditLogResponse[]>(`${API}/audit-logs`); }
  getByUser(userId: number): Observable<AuditLogResponse[]> { return this.http.get<AuditLogResponse[]>(`${API}/audit-logs/user/${userId}`); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${API}/audit-logs/${id}`); }
  deleteAll(): Observable<void> { return this.http.delete<void>(`${API}/audit-logs`); }
}

@Injectable({ providedIn: 'root' })
export class FileUploadService {
  constructor(private http: HttpClient) { }

  upload(file: File): Observable<{ fileUri: string; fileName: string; originalName: string; fileType: string; fileSize: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${API}/files/upload`, formData);
  }

  getFileUrl(fileUri: string): string {
    if (!fileUri) return '';
    if (fileUri.startsWith('http')) return fileUri;
    const base = API.replace('/api', '');
    return base + fileUri;
  }
}
