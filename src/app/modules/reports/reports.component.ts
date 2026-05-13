import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportApiService, CaseApiService, HearingApiService, JudgmentApiService, ComplianceApiService } from '../../core/services/api.service';
import { ReportResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./reports.html"
})
export class ReportsComponent implements OnInit {
  reports: ReportResponse[] = [];
  loading = true;
  scope = '';
  generating = false;
  generated: ReportResponse | null = null;
  parsedMetrics: Record<string,any> | null = null;
  selectedReport: ReportResponse | null = null;

  constructor(
    private api: ReportApiService,
    private caseApi: CaseApiService,
    private hearingApi: HearingApiService,
    private judgmentApi: JudgmentApiService,
    private complianceApi: ComplianceApiService,
    private auth: AuthService
  ) {}

  get metricEntries(): { key: string, value: any }[] {
    if (!this.parsedMetrics) return [];
    return Object.entries(this.parsedMetrics).map(([key, value]) => ({ key, value }));
  }

  reportMetricEntries(report: ReportResponse): { key: string, value: any }[] {
    try {
      const metrics = JSON.parse(report.metrics);
      return Object.entries(metrics).map(([key, value]) => ({ key, value }));
    } catch {
      return [];
    }
  }

  formatMetricKey(key: string): string {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getMetricValue(key: string): any {
    if (!this.selectedReport) return null;
    try {
      const metrics = JSON.parse(this.selectedReport.metrics);
      return metrics[key] ?? 'N/A';
    } catch {
      return 'N/A';
    }
  }

  viewReport(report: ReportResponse): void {
    this.selectedReport = report;
  }

  backToList(): void {
    this.selectedReport = null;
  }

  ngOnInit(): void {
    this.api.getAll().subscribe({ next: d => { this.reports = d; this.loading = false; }, error: () => this.loading = false });
  }

  generate(): void {
    this.generating = true;
    const userId = this.auth.currentUser?.userId ?? 1;

    if (this.scope === 'CASE') {
      this.caseApi.getAll().pipe(catchError(() => of([]))).subscribe(cases => {
        const metrics = {
          total_cases: cases.length,
          active_cases: cases.filter(c => c.status === 'ACTIVE').length,
          closed_cases: cases.filter(c => c.status === 'CLOSED').length,
          under_review: cases.filter(c => c.status === 'UNDER_REVIEW').length,
          pending_judgment: cases.filter(c => c.status === 'JUDGMENT_PENDING').length,
          avg_duration_days: cases.length > 0 
            ? Math.round(cases.reduce((sum, c) => {
                const filed = new Date(c.filedDate).getTime();
                const now = new Date().getTime();
                return sum + (now - filed) / (1000 * 60 * 60 * 24);
              }, 0) / cases.length)
            : 0
        };
        this.saveReport(userId, metrics);
      });
    } else if (this.scope === 'HEARING') {
      this.hearingApi.getAll().pipe(catchError(() => of([]))).subscribe(hearings => {
        const metrics = {
          total_hearings: hearings.length,
          scheduled: hearings.filter(h => h.status === 'SCHEDULED').length,
          completed: hearings.filter(h => h.status === 'COMPLETED').length,
          adjourned: hearings.filter(h => h.status === 'ADJOURNED').length,
          cancelled: hearings.filter(h => h.status === 'CANCELLED').length
        };
        this.saveReport(userId, metrics);
      });
    } else if (this.scope === 'JUDGMENT') {
      this.judgmentApi.getAll().pipe(catchError(() => of([]))).subscribe(judgments => {
        const metrics = {
          total_judgments: judgments.length,
          finalized: judgments.filter(j => j.status === 'FINAL').length,
          draft: judgments.filter(j => j.status === 'DRAFT').length,
          pending: judgments.filter(j => j.status !== 'FINAL' && j.status !== 'DRAFT').length
        };
        this.saveReport(userId, metrics);
      });
    } else if (this.scope === 'COMPLIANCE') {
      this.complianceApi.getAllRecords().pipe(catchError(() => of([]))).subscribe(records => {
        const metrics = {
          total_records: records.length,
          compliant: records.filter(r => r.result === 'COMPLIANT').length,
          non_compliant: records.filter(r => r.result === 'NON_COMPLIANT').length,
          pending_review: records.filter(r => r.result === 'PENDING').length,
          compliance_rate: records.length > 0 
            ? Math.round((records.filter(r => r.result === 'COMPLIANT').length / records.length) * 100)
            : 0
        };
        this.saveReport(userId, metrics);
      });
    } else {
      this.generating = false;
    }
  }

  private saveReport(userId: number, metrics: Record<string, any>): void {
    this.api.generate({ 
      scope: this.scope, 
      generatedBy: userId,
      metrics: JSON.stringify(metrics)
    } as any).subscribe({
      next: r => {
        this.generated = r;
        try { this.parsedMetrics = JSON.parse(r.metrics); } catch { this.parsedMetrics = metrics; }
        this.reports = [r, ...this.reports];
        this.generating = false;
      },
      error: () => this.generating = false
    });
  }
}
