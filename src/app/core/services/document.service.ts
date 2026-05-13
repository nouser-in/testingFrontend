import { Injectable } from '@angular/core';
import {
  CaseResponse, CourtOrderResponse, DocumentResponse, HearingResponse,
  JudgmentResponse, ProceedingResponse
} from '../../shared/models/models';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  constructor() { }

  /**
   * Generate common CSS styles shared across all document templates
   * to reduce duplication
   */
  private getCommonStyles(): string {
    return `
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
    `;
  }

  /**
   * Generate HTML content for a judgment document
   */
  private generateJudgmentHTML(judgment: JudgmentResponse): string {
    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            ${this.getCommonStyles()}
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

  /**
   * Generate HTML content for a court order document
   */
  private generateOrderHTML(order: CourtOrderResponse): string {
    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            ${this.getCommonStyles()}
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

  /**
   * Generate HTML content for a case details report
   */
  private generateCaseHTML(
    caseData: CaseResponse,
    documents: DocumentResponse[],
    hearings: HearingResponse[],
    judgments: JudgmentResponse[],
    orders: CourtOrderResponse[],
    proceedings: ProceedingResponse[]
  ): string {
    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            ${this.getCommonStyles()}
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
                    <td>${this.getHearingTitle(p, hearings)}</td>
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

  /**
   * Generate PDF from HTML content and trigger print dialog
   */
  private printToPDF(htmlContent: string, filename: string): void {
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

  /**
   * Simple HTML to PDF using browser print dialog
   */
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

  /**
   * Helper to get file name from URI
   */
  private getFileName(fileUri: string): string {
    if (!fileUri) return 'document';
    return fileUri.split('/').pop() || fileUri;
  }

  /**
   * Helper to get hearing title from proceeding
   */
  private getHearingTitle(proceeding: ProceedingResponse, hearings: HearingResponse[]): string {
    const hearing = hearings.find(h => h.hearingId === proceeding.hearingId);
    return hearing ? `Hearing #${hearing.hearingId}` : `Hearing #${proceeding.hearingId}`;
  }

  /**
   * Public method: Download judgment as PDF
   */
  public downloadJudgment(judgment: JudgmentResponse): void {
    const htmlContent = this.generateJudgmentHTML(judgment);
    this.printToPDF(htmlContent, `Judgment_${judgment.judgmentId}.pdf`);
  }

  /**
   * Public method: Download court order as PDF
   */
  public downloadOrder(order: CourtOrderResponse): void {
    const htmlContent = this.generateOrderHTML(order);
    this.printToPDF(htmlContent, `CourtOrder_${order.orderId}.pdf`);
  }

  /**
   * Public method: Download case report as PDF
   */
  public downloadCaseReport(
    caseData: CaseResponse,
    documents: DocumentResponse[],
    hearings: HearingResponse[],
    judgments: JudgmentResponse[],
    orders: CourtOrderResponse[],
    proceedings: ProceedingResponse[]
  ): void {
    const htmlContent = this.generateCaseHTML(
      caseData,
      documents,
      hearings,
      judgments,
      orders,
      proceedings
    );
    this.printToPDF(htmlContent, `Case_${caseData.caseId}_Details.pdf`);
  }
}
