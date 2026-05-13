import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { JudgmentApiService, CaseApiService, UserApiService } from '../../core/services/api.service';
import { CourtOrderResponse, CaseResponse, UserResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-header d-flex justify-content-between align-items-center">
      <h4><i class="bi bi-file-text me-2"></i> Court Orders</h4>
      <div class="d-flex gap-2">
        <a *ngIf="!isAuditorOrCompliance" routerLink="/judgments/orders/new" class="btn btn-outline-primary">
          <i class="bi bi-plus me-1"></i> Issue Order
        </a>
      </div>
    </div>

    <div class="p-4">
      <div class="card">
        <div class="card-body p-0">
          <div *ngIf="loading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Loading court orders...</p>
          </div>
          <div class="table-responsive" *ngIf="!loading">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Case</th>
                  <th>Judge</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let order of orders">
                  <td>#{{ order.orderId }}</td>
                  <td>{{ order.caseTitle }}</td>
                  <td>{{ order.judgeName }}</td>
                  <td>{{ order.description | slice:0:50 }}...</td>
                  <td>{{ order.date | date:'mediumDate' }}</td>
                  <td>
                    <span class="badge" [ngClass]="order.status === 'ACTIVE' ? 'bg-success' : order.status === 'SERVED' ? 'bg-info' : 'bg-secondary'">
                      {{ order.status }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-info" (click)="viewOrder(order)">
                      <i class="bi bi-eye"></i>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="orders.length === 0">
                  <td colspan="7" class="text-center text-muted py-4">No court orders</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" [class.show]="selectedOrder" [style.display]="selectedOrder ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-lg judgment-modal">
        <div class="modal-content judgment-content">
          <div class="modal-header judgment-header">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-file-text" style="font-size: 1.5rem; color: #667eea;"></i>
              <div>
                <h5 class="modal-title mb-0">Court Order Details</h5>
                <small class="text-muted">Order #{{ selectedOrder?.orderId }}</small>
              </div>
            </div>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body judgment-body" *ngIf="selectedOrder">
            <div class="mb-4 pb-3 border-bottom">
              <span class="badge p-2 fs-6" [ngClass]="selectedOrder.status === 'ACTIVE' ? 'bg-success' : selectedOrder.status === 'SERVED' ? 'bg-info' : 'bg-secondary'">
                <i class="bi me-2" [ngClass]="selectedOrder.status === 'ACTIVE' ? 'bi-check-circle' : selectedOrder.status === 'SERVED' ? 'bi-check-circle' : 'bi-file-earmark-text'"></i>
                {{ selectedOrder.status }}
              </span>
            </div>
            <div class="row g-4 mb-4">
              <div class="col-md-6">
                <div class="info-card">
                  <div class="info-label">Order ID</div>
                  <div class="info-value">#{{ selectedOrder.orderId }}</div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="info-card">
                  <div class="info-label">Date Issued</div>
                  <div class="info-value">{{ selectedOrder.date | date:'mediumDate' }}</div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="info-card">
                  <div class="info-label">Judge</div>
                  <div class="info-value">{{ selectedOrder.judgeName }}</div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="info-card">
                  <div class="info-label">Case</div>
                  <div class="info-value">{{ selectedOrder.caseTitle }}</div>
                </div>
              </div>
            </div>
            <div class="summary-section">
              <div class="summary-title">Description</div>
              <div class="summary-content">{{ selectedOrder.description }}</div>
            </div>
          </div>
          <div class="judgment-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Close</button>
            <button type="button" class="btn btn-primary" (click)="downloadOrderPDF(selectedOrder)">
              <i class="bi bi-download me-1"></i> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .judgment-modal {
        max-width: 800px;
      }
      .judgment-content {
        border: none;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        overflow: hidden;
      }
      .judgment-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 1.5rem;
      }
      .judgment-body {
        padding: 2rem;
        background: #f8f9fa;
      }
      .info-card {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1rem;
      }
      .info-label {
        font-size: 0.8rem;
        color: #6c757d;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .info-value {
        font-size: 1rem;
        font-weight: 700;
      }
      .summary-section {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        border: 1px solid #e9ecef;
      }
      .summary-title {
        font-weight: 700;
        margin-bottom: 1rem;
      }
      .summary-content {
        color: #495057;
        line-height: 1.8;
      }
      .judgment-footer {
        background: white;
        border-top: 1px solid #e9ecef;
        padding: 1rem 1.5rem;
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
    `
  ]
})
export class OrdersListComponent implements OnInit {
  orders: CourtOrderResponse[] = [];
  cases: CaseResponse[] = [];
  judges: UserResponse[] = [];
  loading = true;
  selectedOrder: CourtOrderResponse | null = null;

  constructor(
    private api: JudgmentApiService,
    private caseApi: CaseApiService,
    private userApi: UserApiService,
    public auth: AuthService
  ) {}

  get isAuditorOrCompliance(): boolean {
    return this.auth.hasRole('AUDITOR') || this.auth.hasRole('COMPLIANCE');
  }

  get isJudge(): boolean {
    return this.auth.hasRole('JUDGE');
  }

  ngOnInit(): void {
    const userId = this.auth.currentUser?.userId;

    forkJoin({
      cases: this.caseApi.getAll(),
      judges: this.userApi.getByRole('JUDGE'),
      orders: this.api.getAllOrders()
    }).subscribe({
      next: ({ cases, judges, orders }) => {
        this.cases = cases;
        this.judges = judges;

        const filteredOrders = this.isJudge && userId
          ? orders.filter(o => o.judgeId === userId)
          : orders;

        this.orders = filteredOrders.map(o => ({
          ...o,
          caseTitle: o.caseTitle || cases.find(c => c.caseId === o.caseId)?.title || 'Unknown',
          judgeName: o.judgeName || judges.find(u => u.userId === o.judgeId)?.name || 'Unknown'
        }));

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  viewOrder(order: CourtOrderResponse): void {
    this.selectedOrder = order;
  }

  closeModal(): void {
    this.selectedOrder = null;
  }

  downloadOrderPDF(order: CourtOrderResponse | null): void {
    if (!order) return;
    const htmlContent = this.generateOrderHTML(order);
    this.generatePDF(htmlContent, `CourtOrder_${order.orderId}.pdf`);
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
            <span class="badge ${order.status === 'ACTIVE' ? 'badge-active' : order.status === 'SERVED' ? 'badge-served' : 'badge-expired'}">
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
            <div class="content-box">${order.description.replace(/\n/g, '<br>')}</div>
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
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    this.simpleHTMLToPDF(htmlContent, filename);
    document.body.removeChild(tempDiv);
  }

  private simpleHTMLToPDF(htmlContent: string, filename: string): void {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 100);
    }
  }
}

