import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { JudgmentApiService, CaseApiService, UserApiService } from '../../core/services/api.service';
import { JudgmentResponse, CourtOrderResponse, CaseResponse, UserResponse } from '../../shared/models/models';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-judgments-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-header d-flex justify-content-between align-items-center">
      <h4><i class="bi bi-hammer me-2"></i>Judgments</h4>
      <div class="d-flex gap-2">
        <a *ngIf="!isAuditorOrCompliance" routerLink="/judgments/orders/new" class="btn btn-outline-primary"><i class="bi bi-file-text me-1"></i>Issue Order</a>
        <a *ngIf="!isAuditorOrCompliance" routerLink="/judgments/new" class="btn btn-primary"><i class="bi bi-plus me-1"></i>Record Judgment</a>
      </div>
    </div>
    <div class="p-4">
      <div class="card">
        <div class="card-body p-0">
          <div *ngIf="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
          <div class="table-responsive" *ngIf="!loading">
            <table class="table table-hover mb-0">
              <thead><tr><th>ID</th><th>Case</th><th>Judge</th><th>Summary</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                <tr *ngFor="let j of judgments">
                  <td>#{{ j.judgmentId }}</td>
                  <td>{{ j.caseTitle }}</td>
                  <td>{{ j.judgeName }}</td>
                  <td>{{ j.summary | slice:0:50 }}...</td>
                  <td>{{ j.date | date:'mediumDate' }}</td>
                  <td><span class="badge" [ngClass]="j.status==='FINAL'?'bg-success':'bg-warning text-dark'">{{ j.status }}</span></td>
                  <td>
                    <button class="btn btn-sm btn-info me-1" (click)="viewJudgment(j)">
                      <i class="bi bi-eye"></i>
                    </button>
                    <button *ngIf="j.status==='DRAFT'" class="btn btn-sm btn-success" (click)="finalize(j.judgmentId)">
                      <i class="bi bi-check-circle me-1"></i>Finalize
                    </button>
                  </td>
                </tr>
                <tr *ngIf="judgments.length===0"><td colspan="7" class="text-center text-muted py-4">No judgments</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Judgment Modal -->
    <div class="modal fade" [class.show]="selectedJudgment" [style.display]="selectedJudgment ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-lg judgment-modal">
        <div class="modal-content judgment-content">
          <div class="modal-header judgment-header">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-gavel" style="font-size: 1.5rem; color: #667eea;"></i>
              <div>
                <h5 class="modal-title mb-0">Judgment Details</h5>
                <small class="text-muted">Judgment #{{ selectedJudgment?.judgmentId }}</small>
              </div>
            </div>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body judgment-body" *ngIf="selectedJudgment">
            <!-- Status Badge -->
            <div class="mb-4 pb-3 border-bottom">
              <span class="badge p-2 fs-6" 
                    [ngClass]="selectedJudgment.status==='FINAL'?'bg-success':'bg-warning text-dark'">
                <i class="bi me-2" [ngClass]="selectedJudgment.status==='FINAL'?'bi-check-circle':'bi-hourglass'"></i>
                {{ selectedJudgment.status }}
              </span>
            </div>

            <!-- Judgment Info Grid -->
            <div class="row g-4 mb-4">
              <!-- Judgment ID -->
              <div class="col-md-6">
                <div class="info-card">
                  <div class="info-label"><i class="bi bi-hash me-2"></i>Judgment ID</div>
                  <div class="info-value">#{{ selectedJudgment.judgmentId }}</div>
                </div>
              </div>

              <!-- Date -->
              <div class="col-md-6">
                <div class="info-card">
                  <div class="info-label"><i class="bi bi-calendar3 me-2"></i>Date</div>
                  <div class="info-value">{{ selectedJudgment.date | date:'mediumDate' }}</div>
                </div>
              </div>

              <!-- Case -->
              <div class="col-md-6">
                <div class="info-card">
                  <div class="info-label"><i class="bi bi-folder me-2"></i>Case</div>
                  <div class="info-value">{{ selectedJudgment.caseTitle }}</div>
                </div>
              </div>

              <!-- Judge -->
              <div class="col-md-6">
                <div class="info-card">
                  <div class="info-label"><i class="bi bi-person-badge me-2"></i>Judge</div>
                  <div class="info-value">{{ selectedJudgment.judgeName }}</div>
                </div>
              </div>
            </div>

            <!-- Summary Section -->
            <div class="summary-section">
              <h6 class="summary-title"><i class="bi bi-file-text me-2"></i>Judgment Summary</h6>
              <div class="summary-content">{{ selectedJudgment.summary }}</div>
            </div>
          </div>
          <div class="modal-footer judgment-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Close</button>
            <button type="button" class="btn btn-primary" (click)="downloadJudgmentPDF(selectedJudgment)">
              <i class="bi bi-download me-1"></i>Download as PDF
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Modal -->
    <div class="modal fade" [class.show]="selectedOrder" [style.display]="selectedOrder ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-lg court-order-modal">
        <div class="modal-content court-order-content">
          <div class="modal-header court-order-header">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-file-earmark-text" style="font-size: 1.5rem; color: #667eea;"></i>
              <div>
                <h5 class="modal-title mb-0">Court Order Details</h5>
                <small class="text-muted">Order #{{ selectedOrder?.orderId }}</small>
              </div>
            </div>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body court-order-body" *ngIf="selectedOrder">
            <!-- Status Badge -->
            <div class="mb-4 pb-3 border-bottom">
              <span class="badge p-2 fs-6" 
                    [ngClass]="selectedOrder.status==='ACTIVE'?'bg-success':selectedOrder.status==='SERVED'?'bg-info':'bg-secondary'">
                <i class="bi me-2" [ngClass]="selectedOrder.status==='ACTIVE'?'bi-check-circle':selectedOrder.status==='SERVED'?'bi-checkmark-all':'bi-clock'"></i>
                {{ selectedOrder.status }}
              </span>
            </div>

            <!-- Order Info Grid -->
            <div class="row g-4 mb-4">
              <!-- Order ID -->
              <div class="col-md-6">
                <div class="info-card">
                  <div class="info-label"><i class="bi bi-hash me-2"></i>Order ID</div>
                  <div class="info-value">#{{ selectedOrder.orderId }}</div>
                </div>
              </div>

              <!-- Date -->
              <div class="col-md-6">
                <div class="info-card">
                  <div class="info-label"><i class="bi bi-calendar3 me-2"></i>Issued Date</div>
                  <div class="info-value">{{ selectedOrder.date | date:'mediumDate' }}</div>
                </div>
              </div>

              <!-- Case -->
              <div class="col-md-6">
                <div class="info-card">
                  <div class="info-label"><i class="bi bi-folder me-2"></i>Case</div>
                  <div class="info-value">{{ selectedOrder.caseTitle }}</div>
                </div>
              </div>

              <!-- Judge -->
              <div class="col-md-6">
                <div class="info-card">
                  <div class="info-label"><i class="bi bi-person-badge me-2"></i>Judge</div>
                  <div class="info-value">{{ selectedOrder.judgeName }}</div>
                </div>
              </div>
            </div>

            <!-- Description Section -->
            <div class="description-section">
              <h6 class="description-title"><i class="bi bi-file-text me-2"></i>Order Description</h6>
              <div class="description-content">{{ selectedOrder.description }}</div>
            </div>
          </div>
          <div class="modal-footer court-order-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Close</button>
            <button type="button" class="btn btn-primary" (click)="downloadOrderPDF(selectedOrder)">
              <i class="bi bi-download me-1"></i>Download as PDF
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div class="modal-backdrop fade show" *ngIf="selectedJudgment || selectedOrder" (click)="closeModal()"></div>
  `,
  styles: [`
    .court-order-modal {
      max-width: 700px;
    }

    .court-order-content {
      border: none;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .court-order-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 1.5rem;
    }

    .court-order-header .modal-title {
      font-weight: 700;
      font-size: 1.25rem;
    }

    .court-order-body {
      padding: 2rem;
      background: #f8f9fa;
    }

    .info-card {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      transition: all 0.3s ease;
    }

    .info-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    .info-label {
      font-size: 0.85rem;
      color: #6c757d;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 1rem;
      font-weight: 600;
      color: #212529;
      margin-top: 0.5rem;
    }

    .description-section {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .description-title {
      color: #212529;
      font-weight: 700;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
    }

    .description-content {
      color: #495057;
      line-height: 1.8;
      font-size: 0.95rem;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .court-order-footer {
      background: white;
      border-top: 1px solid #e9ecef;
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .badge {
      border-radius: 20px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
    }

    /* Judgment Modal Styles */
    .judgment-modal {
      max-width: 700px;
    }

    .judgment-content {
      border: none;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .judgment-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 1.5rem;
    }

    .judgment-header .modal-title {
      font-weight: 700;
      font-size: 1.25rem;
    }

    .judgment-body {
      padding: 2rem;
      background: #f8f9fa;
    }

    .summary-section {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .summary-title {
      color: #212529;
      font-weight: 700;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
    }

    .summary-content {
      color: #495057;
      line-height: 1.8;
      font-size: 0.95rem;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .judgment-footer {
      background: white;
      border-top: 1px solid #e9ecef;
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `]
})
export class JudgmentsListComponent implements OnInit {
  tab = 'judgments';
  judgments: JudgmentResponse[] = [];
  orders: CourtOrderResponse[] = [];
  cases: CaseResponse[] = [];
  judges: UserResponse[] = [];
  loading = true;
  ordersLoading = false;
  selectedJudgment: JudgmentResponse | null = null;
  selectedOrder: CourtOrderResponse | null = null;

  constructor(
    private api: JudgmentApiService,
    private caseApi: CaseApiService,
    private userApi: UserApiService,
    private route: ActivatedRoute,
    private router: Router,
    public auth: AuthService
  ) {}

  get isAuditorOrCompliance(): boolean { return this.auth.hasRole('AUDITOR') || this.auth.hasRole('COMPLIANCE'); }
  get isJudge(): boolean { return this.auth.hasRole('JUDGE'); }

  ngOnInit(): void {
    if (this.route.snapshot.routeConfig?.path === 'orders') {
      this.tab = 'orders';
    }

    const userId = this.auth.currentUser?.userId;

    if (this.isJudge && userId) {
      // For judges, fetch all data and filter on frontend
      forkJoin({
        cases: this.caseApi.getAll(),
        judges: this.userApi.getByRole('JUDGE'),
        judgments: this.api.getAll(),
        orders: this.api.getAllOrders()
      }).subscribe({
        next: ({ cases, judges, judgments, orders }) => {
          this.cases = cases;
          this.judges = judges;
          this.judgments = judgments
            .filter(j => j.judgeId === userId)
            .map(j => ({
              ...j,
              caseTitle: j.caseTitle || cases.find(c => c.caseId === j.caseId)?.title || 'Unknown',
              judgeName: j.judgeName || judges.find(u => u.userId === j.judgeId)?.name || 'Unknown'
            }));
          this.orders = orders
            .filter(o => o.judgeId === userId)
            .map(o => ({
              ...o,
              caseTitle: o.caseTitle || cases.find(c => c.caseId === o.caseId)?.title || 'Unknown',
              judgeName: o.judgeName || judges.find(u => u.userId === o.judgeId)?.name || 'Unknown'
            }));
          this.loading = false;
        },
        error: () => this.loading = false
      });
    } else {
      forkJoin({
        cases: this.caseApi.getAll(),
        judges: this.userApi.getByRole('JUDGE'),
        judgments: this.api.getAll(),
        orders: this.api.getAllOrders()
      }).subscribe({
        next: ({ cases, judges, judgments, orders }) => {
          this.cases = cases;
          this.judges = judges;
          this.judgments = judgments.map(j => ({
            ...j,
            caseTitle: j.caseTitle || cases.find(c => c.caseId === j.caseId)?.title || 'Unknown',
            judgeName: j.judgeName || judges.find(u => u.userId === j.judgeId)?.name || 'Unknown'
          }));
          this.orders = orders.map(o => ({
            ...o,
            caseTitle: o.caseTitle || cases.find(c => c.caseId === o.caseId)?.title || 'Unknown',
            judgeName: o.judgeName || judges.find(u => u.userId === o.judgeId)?.name || 'Unknown'
          }));
          this.loading = false;
        },
        error: () => this.loading = false
      });
    }
  }

  loadOrders(): void {
    if (this.orders.length) return;
    this.ordersLoading = true;
    const userId = this.auth.currentUser?.userId;
    this.api.getAllOrders().subscribe({
      next: orders => {
        let filteredOrders = orders;
        if (this.isJudge && userId) {
          filteredOrders = orders.filter(o => o.judgeId === userId);
        }
        this.orders = filteredOrders.map(o => ({
          ...o,
          caseTitle: o.caseTitle || this.cases.find(c => c.caseId === o.caseId)?.title || 'Unknown',
          judgeName: o.judgeName || this.judges.find(u => u.userId === o.judgeId)?.name || 'Unknown'
        }));
        this.ordersLoading = false;
      },
      error: () => this.ordersLoading = false
    });
  }

  finalize(id: number): void {
    this.api.finalize(id).subscribe(j => {
      const updated = {
        ...j,
        caseTitle: this.cases.find(c => c.caseId === j.caseId)?.title || 'Unknown',
        judgeName: this.judges.find(u => u.userId === j.judgeId)?.name || 'Unknown'
      };
      this.judgments = this.judgments.map(x => x.judgmentId === id ? updated : x);
    });
  }

  updateOrder(id: number, status: string): void {
    this.api.updateOrderStatus(id, status).subscribe(o => {
      const updated = {
        ...o,
        caseTitle: this.cases.find(c => c.caseId === o.caseId)?.title || 'Unknown',
        judgeName: this.judges.find(u => u.userId === o.judgeId)?.name || 'Unknown'
      };
      this.orders = this.orders.map(x => x.orderId === id ? updated : x);
    });
  }

  viewJudgment(j: JudgmentResponse): void {
    this.selectedJudgment = j;
  }

  viewOrder(o: CourtOrderResponse): void {
    this.selectedOrder = o;
  }

  closeModal(): void {
    this.selectedJudgment = null;
    this.selectedOrder = null;
  }

  downloadJudgmentPDF(judgment: JudgmentResponse | null): void {
    if (!judgment) return;
    
    // Create canvas for PDF generation
    const htmlContent = this.generateJudgmentHTML(judgment);
    this.generatePDF(htmlContent, `Judgment_${judgment.judgmentId}.pdf`);
  }

  downloadOrderPDF(order: CourtOrderResponse | null): void {
    if (!order) return;
    
    const htmlContent = this.generateOrderHTML(order);
    this.generatePDF(htmlContent, `CourtOrder_${order.orderId}.pdf`);
  }

  private generateJudgmentHTML(judgment: JudgmentResponse): string {
    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0 0 0; font-size: 12px; opacity: 0.9; }
            .section { margin-bottom: 25px; }
            .section-title { background: #f0f0f0; padding: 10px 15px; border-left: 4px solid #667eea; font-weight: bold; margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
            .info-item { border: 1px solid #e0e0e0; padding: 15px; border-radius: 5px; }
            .info-label { font-size: 11px; color: #666; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
            .info-value { font-size: 14px; color: #333; font-weight: 600; }
            .content-box { border: 1px solid #e0e0e0; padding: 15px; border-radius: 5px; background: #fafafa; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #ddd; font-size: 11px; color: #666; text-align: center; }
            .badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .badge-final { background: #28a745; color: white; }
            .badge-draft { background: #ffc107; color: #333; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📋 JUDGMENT DOCUMENT</h1>
            <p>Judgment ID: #${judgment.judgmentId}</p>
          </div>

          <div class="section">
            <div class="section-title">Judgment Status</div>
            <span class="badge ${judgment.status === 'FINAL' ? 'badge-final' : 'badge-draft'}">
              ${judgment.status}
            </span>
          </div>

          <div class="section">
            <div class="section-title">Judgment Information</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Judgment ID</div>
                <div class="info-value">#${judgment.judgmentId}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date Issued</div>
                <div class="info-value">${new Date(judgment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Judge</div>
                <div class="info-value">${judgment.judgeName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Case</div>
                <div class="info-value">${judgment.caseTitle}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Judgment Summary</div>
            <div class="content-box">
              ${judgment.summary.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div class="footer">
            <p>This document is generated from JusticeServe Case Management System</p>
            <p>Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateOrderHTML(order: CourtOrderResponse): string {
    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0 0 0; font-size: 12px; opacity: 0.9; }
            .section { margin-bottom: 25px; }
            .section-title { background: #f0f0f0; padding: 10px 15px; border-left: 4px solid #667eea; font-weight: bold; margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
            .info-item { border: 1px solid #e0e0e0; padding: 15px; border-radius: 5px; }
            .info-label { font-size: 11px; color: #666; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
            .info-value { font-size: 14px; color: #333; font-weight: 600; }
            .content-box { border: 1px solid #e0e0e0; padding: 15px; border-radius: 5px; background: #fafafa; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #ddd; font-size: 11px; color: #666; text-align: center; }
            .badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .badge-active { background: #28a745; color: white; }
            .badge-served { background: #17a2b8; color: white; }
            .badge-expired { background: #6c757d; color: white; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>⚖️ COURT ORDER</h1>
            <p>Order ID: #${order.orderId}</p>
          </div>

          <div class="section">
            <div class="section-title">Order Status</div>
            <span class="badge badge-${order.status.toLowerCase()}">
              ${order.status}
            </span>
          </div>

          <div class="section">
            <div class="section-title">Court Order Details</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Order ID</div>
                <div class="info-value">#${order.orderId}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date Issued</div>
                <div class="info-value">${new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Judge</div>
                <div class="info-value">${order.judgeName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Case</div>
                <div class="info-value">${order.caseTitle}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Order Description</div>
            <div class="content-box">
              ${order.description.replace(/\n/g, '<br>')}
            </div>
          </div>

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
