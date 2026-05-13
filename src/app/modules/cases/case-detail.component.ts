import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CaseApiService, HearingApiService, JudgmentApiService,
  UserApiService, CitizenApiService, NotificationApiService
} from '../../core/services/api.service';

import {
  CaseResponse, CourtOrderResponse, DocumentResponse, HearingResponse,
  JudgmentResponse, ProceedingResponse, UserResponse
} from '../../shared/models/models';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-case-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  templateUrl: "./case-detail.html"
})
export class CaseDetailComponent implements OnInit {
  caseId!: number;
  caseData!: CaseResponse;
  documents: DocumentResponse[] = [];
  hearings: HearingResponse[] = [];
  judgments: JudgmentResponse[] = [];
  orders: CourtOrderResponse[] = [];
  proceedings: ProceedingResponse[] = [];
  selectedProceeding?: ProceedingResponse;
  showProceedingModal = false;
  lawyers: UserResponse[] = [];
  judges: UserResponse[] = [];

  loading = true;
  savingLawyer = false;
  savingJudge = false;
  updatingStatus = false;
  showLawyerPanel = false;
  showJudgePanel = false;
  showDocForm = false;

  selectedLawyerId = '';
  selectedJudgeId = '';
  newStatus = '';
  toast: { msg: string; type: 'success' | 'error' } | null = null;
  docForm = { docType: '', fileUri: '' };

  // Document request form
  showRequestDocForm = false;
  sendingDocRequest = false;
  requestDocForm = { subject: '', content: '', requestedDocType: '' };

  // Clerk document request form
  showClerkDocRequestForm = false;
  sendingClerkDocRequest = false;
  clerkDocRequestForm = { docType: '', description: '', requiredBy: '' };

  statuses = ['FILED', 'UNDER_REVIEW', 'ACTIVE', 'HEARING_SCHEDULED', 'JUDGMENT_PENDING', 'CLOSED', 'DISMISSED'];
  docTypes = ['PETITION', 'EVIDENCE', 'ORDER', 'ID_PROOF', 'LEGAL_DOC'];

  /**
   * Timeline computed getter — ALWAYS reflects current caseData.status.
   * FIX: 'Judgment / Closed' shows done at index >= 4 (JUDGMENT_PENDING)
   * and 'Case Closed' at CLOSED. Added 6-step timeline.
   */
  get computedTimeline() {
    const statusOrder = ['FILED', 'UNDER_REVIEW', 'ACTIVE', 'HEARING_SCHEDULED', 'JUDGMENT_PENDING', 'CLOSED'];
    const idx = statusOrder.indexOf(this.caseData?.status ?? '');
    const hasScheduledHearing = this.hearings.some(h => ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(h.status));
    const hasJudgment = this.judgments.length > 0;
    return [
      { label: 'Case Filed', done: idx >= 0 },
      { label: 'Lawyer Assigned', done: !!this.caseData?.lawyerName },
      { label: 'Under Review / Active', done: idx >= 1 },
      { label: 'Hearing Scheduled', done: idx >= 3 || hasScheduledHearing },
      { label: 'Judgment Pending', done: idx >= 4 || hasJudgment },
      { label: 'Case Closed', done: idx >= 5 || this.caseData?.status === 'CLOSED' || this.judgments.some(j => j.status === 'FINAL') },
    ];
  }

  constructor(
    private route: ActivatedRoute,
    private api: CaseApiService,
    private hearingApi: HearingApiService,
    private judgmentApi: JudgmentApiService,
    private userApi: UserApiService,
    private citizenApi: CitizenApiService,
    private notifApi: NotificationApiService,
    public auth: AuthService
  ) { }

  get isAdmin() { return this.auth.hasRole('ADMIN'); }
  get isClerk() { return this.auth.hasRole('CLERK'); }
  get isJudge() { return this.auth.hasRole('JUDGE'); }
  get isCitizen() { return this.auth.hasRole('CITIZEN'); }
  get isLawyer() { return this.auth.hasRole('LAWYER'); }
  get isCompliance() { return this.auth.hasRole('COMPLIANCE'); }
  get isAuditor() { return this.auth.hasRole('AUDITOR'); }
  get isReviewer() { return this.isCompliance || this.isAuditor; }
  get canAssignLawyer() { return this.isAdmin || this.isClerk; }
  get canAssignJudge() { return this.isAdmin || this.isClerk; }
  get canUpdateStatus() { return this.isAdmin || this.isClerk || this.isJudge; }
  get canVerifyDocs() { return this.isAdmin || this.isClerk; }
  get canScheduleHearing() { return this.isAdmin || this.isClerk || this.isJudge; }
  get reviewPeriod(): string {
    if (!this.caseData) return '';
    const filed = new Date(this.caseData.filedDate);
    const latestJudgment = this.judgments.length
      ? this.judgments.reduce((latest, j) => {
        const date = new Date(j.date);
        return latest > date ? latest : date;
      }, new Date(this.judgments[0].date))
      : null;
    const end = latestJudgment ?? new Date();
    const days = Math.max(0, Math.ceil((end.getTime() - filed.getTime()) / (1000 * 60 * 60 * 24)));
    return `${days} day${days === 1 ? '' : 's'} since filed`;
  }

  ngOnInit(): void {
    this.caseId = +this.route.snapshot.params['id'];
    this.loadCase();
    this.api.getDocuments(this.caseId).subscribe(d => this.documents = d, () => { });
    this.hearingApi.getByCase(this.caseId).subscribe({
      next: h => {
        this.hearings = h;
        if (h.length) {
          forkJoin(h.map(x => this.hearingApi.getProceedings(x.hearingId))).subscribe({
            next: proceedGroups => this.proceedings = proceedGroups.flat(),
            error: () => this.proceedings = []
          });
        } else {
          this.proceedings = [];
        }
      },
      error: () => { this.hearings = []; this.proceedings = []; }
    });
    this.judgmentApi.getByCase(this.caseId).subscribe(j => this.judgments = j, () => { });
    this.judgmentApi.getOrdersByCase(this.caseId).subscribe(o => this.orders = o, () => { });
    if (this.canAssignLawyer || this.canAssignJudge) {
      this.userApi.getByRole('LAWYER').subscribe(d => this.lawyers = d, () => { });
      this.userApi.getByRole('JUDGE').subscribe(d => this.judges = d, () => { });
    }
  }

  loadCase(): void {
    this.loading = true;
    this.api.getById(this.caseId).subscribe({
      next: c => {
        this.caseData = c;
        this.newStatus = c.status;
        this.selectedLawyerId = c.lawyerId ? String(c.lawyerId) : '';
        this.selectedJudgeId = c.judgeId ? String(c.judgeId) : '';
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  toggleLawyerPanel(): void {
    this.showLawyerPanel = !this.showLawyerPanel;
    this.showJudgePanel = false;
  }

  toggleJudgePanel(): void {
    this.showJudgePanel = !this.showJudgePanel;
    this.showLawyerPanel = false;
  }

  assignLawyer(): void {
    const lawyerIdNum = +this.selectedLawyerId;
    if (!lawyerIdNum) return;
    const lawyer = this.lawyers.find(l => +l.userId === lawyerIdNum);
    if (!lawyer) return;

    this.savingLawyer = true;
    this.api.assignLawyer(this.caseId, lawyerIdNum).subscribe({
      next: (updated) => {
        this.caseData = updated;          // FIX: update case object — triggers timeline re-compute
        this.newStatus = updated.status;  // keep status dropdown in sync
        this.showLawyerPanel = false;
        this.savingLawyer = false;
        this.showToast(`Lawyer "${lawyer.name}" assigned successfully!`, 'success');

        // Notify lawyer
        this.notifApi.create({
          userId: lawyer.userId, entityId: this.caseId, category: 'CASE',
          message: `You are assigned as lawyer for Case #${this.caseId}: "${updated.title}". Citizen: ${updated.citizenName}.`
        }).subscribe();

        // Notify citizen via citizenId lookup
        this.citizenApi.getById(updated.citizenId).subscribe({
          next: citizen => {
            this.notifApi.create({
              userId: citizen.userId, entityId: this.caseId, category: 'CASE',
              message: `Your case "${updated.title}" now has lawyer ${lawyer.name} assigned.`
            }).subscribe();
          }, error: () => { }
        });
      },
      error: (e) => {
        this.savingLawyer = false;
        this.showToast(e.error?.message || 'Failed to assign lawyer.', 'error');
      }
    });
  }

  removeLawyer(): void {
    if (!confirm('Remove the assigned lawyer from this case?')) return;
    this.savingLawyer = true;
    this.api.removeLawyer(this.caseId).subscribe({
      next: (updated) => {
        this.caseData = updated;    // FIX: reflect updated case (lawyerName = null)
        this.selectedLawyerId = '';
        this.savingLawyer = false;
        this.showToast('Lawyer removed successfully.', 'success');
      },
      error: (e) => { this.savingLawyer = false; this.showToast(e.error?.message || 'Failed.', 'error'); }
    });
  }

  assignJudge(): void {
    const judgeIdNum = +this.selectedJudgeId;
    if (!judgeIdNum) return;
    const judge = this.judges.find(j => +j.userId === judgeIdNum);
    if (!judge) return;

    this.savingJudge = true;
    this.api.assignJudge(this.caseId, judgeIdNum).subscribe({
      next: (updated) => {
        this.caseData = updated;
        this.showJudgePanel = false;
        this.savingJudge = false;
        this.showToast(`Judge "${judge.name}" assigned successfully!`, 'success');

        // 1. Notify the Judge
        this.notifApi.create({
          userId: judge.userId,
          entityId: this.caseId,
          category: 'CASE',
          message: `You are assigned as Judge for Case #${this.caseId}: "${updated.title}".`
        }).subscribe();

        // 2. Notify the Lawyer (if assigned)
        if (updated.lawyerId) {
          this.notifApi.create({
            userId: updated.lawyerId,
            entityId: this.caseId,
            category: 'CASE',
            message: `Judge ${judge.name} has been assigned to your Case #${this.caseId}: "${updated.title}".`
          }).subscribe();
        }

        // 3. Notify the Citizen
        // We use the citizenId from the updated case response
        this.citizenApi.getById(updated.citizenId).subscribe({
          next: citizen => {
            this.notifApi.create({
              userId: citizen.userId,
              entityId: this.caseId,
              category: 'CASE',
              message: `A Judge (${judge.name}) has been assigned to your case: "${updated.title}".`
            }).subscribe();
          },
          error: () => console.warn('Could not notify citizen of judge assignment')
        });
      },
      error: (e) => {
        this.savingJudge = false;
        this.showToast(e.error?.message || 'Failed to assign judge.', 'error');
      }
    });
  }

  updateStatus(): void {
    if (!this.newStatus) return;
    this.updatingStatus = true;
    this.api.updateStatus(this.caseId, this.newStatus).subscribe({
      next: c => {
        this.caseData = c;          // FIX: replace case object → timeline auto-updates via getter
        this.newStatus = c.status;  // keep select in sync
        this.updatingStatus = false;
        this.showToast(`Status updated to ${c.status}`, 'success');

        // Reload full case data to ensure judge and lawyer names are updated
        this.loadCase();
      },
      error: (e) => {
        this.updatingStatus = false;
        this.showToast(e.error?.message || 'Failed to update status.', 'error');
      }
    });
  }

  addDocument(): void {
    if (!this.docForm.docType || !this.docForm.fileUri) return;
    this.api.addDocument(this.caseId, this.docForm as any).subscribe({
      next: d => {
        this.documents = [...this.documents, d];
        this.showDocForm = false;
        this.docForm = { docType: '', fileUri: '' };
        this.showToast('Document added successfully.', 'success');
      },
      error: (e) => this.showToast(e.error?.message || 'Failed to add document.', 'error')
    });
  }

  verifyDoc(docId: number, status: string): void {
    this.api.verifyDocument(this.caseId, docId, status).subscribe({
      next: d => { this.documents = this.documents.map(x => x.documentId === docId ? d : x); },
      error: (e) => this.showToast(e.error?.message || 'Failed.', 'error')
    });
  }

  finalizeJudgment(judgmentId: number): void {
    if (!confirm('Finalize this judgment? The case will be marked as CLOSED.')) return;
    this.judgmentApi.finalize(judgmentId).subscribe({
      next: j => {
        this.judgments = this.judgments.map(x => x.judgmentId === j.judgmentId ? j : x);
        this.showToast('Judgment finalized. Case will be closed.', 'success');
        // Reload case to get CLOSED status
        this.api.getById(this.caseId).subscribe(c => { this.caseData = c; this.newStatus = c.status; });
      },
      error: (e) => this.showToast(e.error?.message || 'Failed.', 'error')
    });
  }

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { msg, type };
    setTimeout(() => this.toast = null, 4000);
  }

  badge(s: string): string {
    const m: Record<string, string> = {
      FILED: 'bg-secondary', ACTIVE: 'bg-success', CLOSED: 'bg-dark',
      UNDER_REVIEW: 'bg-warning text-dark', HEARING_SCHEDULED: 'bg-info text-dark',
      JUDGMENT_PENDING: 'bg-danger', DISMISSED: 'bg-secondary',
      SCHEDULED: 'bg-primary', IN_PROGRESS: 'bg-info text-dark',
      COMPLETED: 'bg-success', ADJOURNED: 'bg-warning text-dark',
      CANCELLED: 'bg-danger', DRAFT: 'bg-warning text-dark', FINAL: 'bg-success'
    };
    return m[s] ?? 'bg-secondary';
  }

  verifyBadge(s: string): string {
    return s === 'VERIFIED' ? 'bg-success' : s === 'REJECTED' ? 'bg-danger' : 'bg-warning text-dark';
  }

  fileIcon(fileUri: string): string {
    const ext = (fileUri || '').split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      pdf: 'bi-file-earmark-pdf text-danger',
      doc: 'bi-file-earmark-word text-primary', docx: 'bi-file-earmark-word text-primary',
      jpg: 'bi-file-earmark-image text-success', jpeg: 'bi-file-earmark-image text-success',
      png: 'bi-file-earmark-image text-success',
      zip: 'bi-file-earmark-zip text-warning', rar: 'bi-file-earmark-zip text-warning'
    };
    return map[ext] || 'bi-file-earmark';
  }

  getFileName(fileUri: string): string {
    if (!fileUri) return 'document';
    return fileUri.split('/').pop() || fileUri;
  }

  openProceeding(p: ProceedingResponse): void {
    this.selectedProceeding = p;
    this.showProceedingModal = true;
  }

  closeProceeding(): void {
    this.showProceedingModal = false;
    this.selectedProceeding = undefined;
  }

  getHearingTitle(proceeding: ProceedingResponse): string {
    const hearing = this.hearings.find(h => h.hearingId === proceeding.hearingId);
    return hearing ? `Hearing #${hearing.hearingId}` : `Hearing #${proceeding.hearingId}`;
  }

  getProceedingJudgeName(proceeding: ProceedingResponse): string {
    const hearing = this.hearings.find(h => h.hearingId === proceeding.hearingId);
    return hearing?.judgeName || this.caseData?.judgeName || 'N/A';
  }

  sendDocumentRequest(): void {
    if (!this.requestDocForm.subject || !this.requestDocForm.content || !this.requestDocForm.requestedDocType) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    this.sendingDocRequest = true;
    const userId = this.auth.currentUser?.userId;
    if (!userId) {
      this.showToast('User not logged in', 'error');
      this.sendingDocRequest = false;
      return;
    }

    const notificationMessage =
      `Document Request for Case #${this.caseId} - ${this.requestDocForm.requestedDocType}\n` +
      `Case Title: ${this.caseData.title}\n` +
      // `Case Description: ${this.caseData.description || 'No description provided.'}\n` +
      `Subject: ${this.requestDocForm.subject}\n` +
      `Details: ${this.requestDocForm.content}`;

    const notifyCitizen = (citizenUserId: number) => {
      return this.notifApi.create({
        userId: citizenUserId,
        entityId: this.caseId,
        category: 'CASE',
        message: notificationMessage
      });
    };

    const notifyLawyer = () => {
      return this.notifApi.create({
        userId,
        entityId: this.caseId,
        category: 'CASE',
        message:
          `You requested documents for Case #${this.caseId} - ${this.requestDocForm.requestedDocType}\n` +
          `Case Title: ${this.caseData.title}\n` +
          `Case Description: ${this.caseData.description || 'No description provided.'}\n` +
          `Subject: ${this.requestDocForm.subject}\n` +
          `Details: ${this.requestDocForm.content}`
      });
    };

    this.citizenApi.getById(this.caseData.citizenId).subscribe({
      next: citizen => {
        notifyCitizen(citizen.userId).subscribe({
          next: () => {
            notifyLawyer().subscribe({
              next: () => {
                this.showRequestDocForm = false;
                this.requestDocForm = { subject: '', content: '', requestedDocType: '' };
                this.sendingDocRequest = false;
                this.showToast('Document request notification sent to citizen and saved for you.', 'success');
              },
              error: (e: any) => {
                console.error('Error notifying lawyer:', e);
                this.sendingDocRequest = false;
                this.showToast('Citizen was notified, but failed to notify lawyer.', 'error');
              }
            });
          },
          error: (e: any) => {
            console.error('Error creating citizen notification:', e);
            this.sendingDocRequest = false;
            this.showToast('Failed to send document request to citizen: ' + (e.error?.message || e.message), 'error');
          }
        });
      },
      error: (e: any) => {
        console.error('Error loading citizen user id:', e);
        this.sendingDocRequest = false;
        this.showToast('Unable to resolve citizen for notification.', 'error');
      }
    });
  }

  sendClerkDocumentRequest(): void {
    if (!this.clerkDocRequestForm.docType || !this.clerkDocRequestForm.description || !this.clerkDocRequestForm.requiredBy) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }
    if (!this.caseData.lawyerId) {
      this.showToast('No lawyer assigned to this case', 'error');
      return;
    }

    const clerkId = this.auth.currentUser?.userId;
    if (!clerkId) {
      this.showToast('User not logged in', 'error');
      return;
    }

    this.sendingClerkDocRequest = true;

    // Create notification message for lawyer using CASE category (backend doesn't support DOCUMENT_REQUEST)
    const notificationMessage =
      `Document Request from Clerk\nRequested Document Type: ${this.clerkDocRequestForm.docType}\nCase Title: ${this.caseData.title}\nDescription: ${this.clerkDocRequestForm.description}\nRequired By: ${this.clerkDocRequestForm.requiredBy}\nRequested By: ${this.auth.currentUser?.name || 'Court Clerk'}`;

    console.log('Sending notification with payload:', {
      userId: this.caseData.lawyerId!,
      entityId: this.caseId,
      category: 'CASE',
      message: notificationMessage
    });

    // Send notification to lawyer with CASE category (backend doesn't support DOCUMENT_REQUEST enum)
    this.notifApi.create({
      userId: this.caseData.lawyerId!,
      entityId: this.caseId,
      category: 'CASE',
      message: notificationMessage
    }).subscribe({
      next: (response) => {
        console.log('Document request notification sent successfully:', response);
        this.showToast('Document request sent to lawyer successfully', 'success');
        this.showClerkDocRequestForm = false;
        this.clerkDocRequestForm = { docType: '', description: '', requiredBy: '' };
        this.sendingClerkDocRequest = false;
      },
      error: (err) => {
        console.error('Error sending document request notification:', err);
        console.error('Error details:', err.error);
        this.showToast('Failed to send document request: ' + (err.error?.message || err.message), 'error');
        this.sendingClerkDocRequest = false;
      }
    });
  }

  downloadCasePDF(): void {
    const htmlContent = this.generateCaseHTML();
    this.generatePDF(htmlContent, `Case_${this.caseId}_Details.pdf`);
  }

  private generateCaseHTML(): string {
    const caseData = this.caseData;
    const documents = this.documents;
    const hearings = this.hearings;
    const judgments = this.judgments;
    const orders = this.orders;
    const proceedings = this.proceedings;

    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0 0 0; font-size: 12px; opacity: 0.9; }
            .section { margin-bottom: 25px; page-break-inside: avoid; }
            .section-title { background: #f0f0f0; padding: 10px 15px; border-left: 4px solid #667eea; font-weight: bold; margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
            .info-item { border: 1px solid #e0e0e0; padding: 15px; border-radius: 5px; }
            .info-label { font-size: 11px; color: #666; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
            .info-value { font-size: 14px; color: #333; font-weight: 600; }
            .content-box { border: 1px solid #e0e0e0; padding: 15px; border-radius: 5px; background: #fafafa; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; font-weight: bold; }
            .badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .badge-active { background: #28a745; color: white; }
            .badge-closed { background: #6c757d; color: white; }
            .badge-under_review { background: #ffc107; color: #333; }
            .badge-hearing_scheduled { background: #17a2b8; color: white; }
            .badge-judgment_pending { background: #dc3545; color: white; }
            .badge-dismissed { background: #6c757d; color: white; }
            .badge-filed { background: #007bff; color: white; }
            .badge-scheduled { background: #28a745; color: white; }
            .badge-completed { background: #17a2b8; color: white; }
            .badge-adjourned { background: #ffc107; color: #333; }
            .badge-cancelled { background: #dc3545; color: white; }
            .badge-draft { background: #ffc107; color: #333; }
            .badge-final { background: #28a745; color: white; }
            .badge-verified { background: #28a745; color: white; }
            .badge-rejected { background: #dc3545; color: white; }
            .badge-pending { background: #ffc107; color: #333; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #ddd; font-size: 11px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📋 CASE DETAILS REPORT</h1>
            <p>Case ID: #${caseData.caseId} - ${caseData.title}</p>
          </div>

          <div class="section">
            <div class="section-title">Case Status</div>
            <span class="badge badge-${caseData.status.toLowerCase().replace('_', '_')}">
              ${caseData.status.replace('_', ' ')}
            </span>
          </div>

          <div class="section">
            <div class="section-title">Case Information</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Case ID</div>
                <div class="info-value">#${caseData.caseId}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Title</div>
                <div class="info-value">${caseData.title}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Filed Date</div>
                <div class="info-value">${new Date(caseData.filedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Citizen</div>
                <div class="info-value">${caseData.citizenName || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Assigned Lawyer</div>
                <div class="info-value">${caseData.lawyerName || 'Not Assigned'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Assigned Judge</div>
                <div class="info-value">${caseData.judgeName || 'Not Assigned'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Case Description</div>
            <div class="content-box">
              ${caseData.description ? caseData.description.replace(/\n/g, '<br>') : 'No description provided.'}
            </div>
          </div>

          ${documents.length > 0 ? `
          <div class="section">
            <div class="section-title">Documents (${documents.length})</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>File Name</th>
                  <th>Uploaded Date</th>
                  <th>Verification Status</th>
                </tr>
              </thead>
              <tbody>
                ${documents.map(d => `
                  <tr>
                    <td>${d.docType}</td>
                    <td>${this.getFileName(d.fileUri)}</td>
                    <td>${new Date(d.uploadedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td><span class="badge badge-${d.verificationStatus.toLowerCase()}">${d.verificationStatus}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${hearings.length > 0 ? `
          <div class="section">
            <div class="section-title">Hearings (${hearings.length})</div>
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Judge</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${hearings.map(h => `
                  <tr>
                    <td>#${h.hearingId}</td>
                    <td>${h.judgeName}</td>
                    <td>${new Date(h.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td>${h.time}</td>
                    <td><span class="badge badge-${h.status.toLowerCase()}">${h.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${judgments.length > 0 ? `
          <div class="section">
            <div class="section-title">Judgments (${judgments.length})</div>
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Summary</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${judgments.map(j => `
                  <tr>
                    <td>#${j.judgmentId}</td>
                    <td>${j.summary.length > 50 ? j.summary.substring(0, 50) + '...' : j.summary}</td>
                    <td>${new Date(j.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td><span class="badge badge-${j.status.toLowerCase()}">${j.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${orders.length > 0 ? `
          <div class="section">
            <div class="section-title">Court Orders (${orders.length})</div>
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${orders.map(o => `
                  <tr>
                    <td>#${o.orderId}</td>
                    <td>${o.description.length > 50 ? o.description.substring(0, 50) + '...' : o.description}</td>
                    <td>${new Date(o.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td><span class="badge badge-pending">${o.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${proceedings.length > 0 ? `
          <div class="section">
            <div class="section-title">Proceedings (${proceedings.length})</div>
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Hearing</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${proceedings.map(p => `
                  <tr>
                    <td>#${p.proceedingId}</td>
                    <td>${this.getHearingTitle(p)}</td>
                    <td>${p.notes.length > 50 ? p.notes.substring(0, 50) + '...' : p.notes}</td>
                    <td>${new Date(p.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="footer">
            <p>This document is generated from JusticeServe Case Management System</p>
            <p>Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </body>
      </html>
    `;
  }

  private generatePDF(htmlContent: string, filename: string): void {
    // Create a temporary div to hold the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    // Use html2pdf-like approach with canvas
    const element = tempDiv.querySelector('body') || tempDiv;
    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    // Alternative: Simple PDF generation using canvas and blob
    this.simpleHTMLToPDF(htmlContent, filename);

    // Cleanup
    document.body.removeChild(tempDiv);
  }

  private simpleHTMLToPDF(htmlContent: string, filename: string): void {
    // Create a new window to print to PDF
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait a moment for content to load, then print
      setTimeout(() => {
        printWindow.print();
        // Optional: Close after printing
        // printWindow.close();
      }, 100);
    }
  }
}
