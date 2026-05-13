import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CaseApiService, HearingApiService, JudgmentApiService, CitizenApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  loading = true;
  stats: any = {};
  recentCases: any[] = [];
  recentHearings: any[] = [];

  constructor(
    private caseApi: CaseApiService,
    private hearingApi: HearingApiService,
    private judgmentApi: JudgmentApiService,
    private citizenApi: CitizenApiService,
    public auth: AuthService
  ) {}

  get userName(): string { return this.auth.currentUser?.name ?? ''; }
  get userRole(): string { return this.auth.currentUser?.role ?? ''; }
  get isAdmin(): boolean { return this.auth.hasRole('ADMIN'); }
  get isJudge(): boolean { return this.auth.hasRole('JUDGE'); }
  get isClerk(): boolean { return this.auth.hasRole('CLERK'); }
  get isLawyer(): boolean { return this.auth.hasRole('LAWYER'); }
  get isCitizen(): boolean { return this.auth.hasRole('CITIZEN'); }
  get isCompliance(): boolean { return this.auth.hasRole('COMPLIANCE'); }
  get isAuditor(): boolean { return this.auth.hasRole('AUDITOR'); }

  ngOnInit(): void {
    const userId = this.auth.currentUser?.userId;
    const role = this.auth.currentUser?.role;

    if (role === 'CITIZEN') {
      this.citizenApi.getByUserId(userId!).subscribe({
        next: citizen => {
          this.caseApi.getByCitizen(citizen.citizenId).subscribe(cases => {
            this.stats.myCases = cases.length;
            this.stats.myActiveCases = cases.filter(c => c.status === 'ACTIVE').length;
            this.stats.myClosedCases = cases.filter(c => c.status === 'CLOSED').length;
            this.recentCases = cases.slice(-5).reverse();
            this.loading = false;
          });
        },
        error: () => { this.stats = {}; this.loading = false; }
      });

    } else if (role === 'JUDGE') {
      forkJoin({
        hearings: this.hearingApi.getByJudge(userId!).pipe(catchError(() => of([]))),
        judgments: this.judgmentApi.getAll().pipe(catchError(() => of([]))),
        cases: this.caseApi.getAll().pipe(catchError(() => of([])))
      }).subscribe(({ hearings, judgments, cases }) => {
        // Filter cases assigned to this judge
        const judgesCases = cases.filter((c: any) => c.judgeId === userId);
        
        this.stats.myHearings = hearings.length;
        // Pending Judgments: cases that are UNDER_REVIEW or don't have a judgment yet
        this.stats.pendingJudgments = judgesCases.filter((c: any) => 
          c.status === 'UNDER_REVIEW' || c.status === 'HEARING_SCHEDULED' || c.status === 'JUDGMENT_PENDING'
        ).length;
        // Finalized: cases with CLOSED status
        this.stats.finalizedJudgments = judgesCases.filter((c: any) => c.status === 'CLOSED').length;
        this.stats.totalCases = judgesCases.length;
        this.recentHearings = (hearings as any[]).slice(-5).reverse();
        this.loading = false;
      });

    } else if (role === 'LAWYER') {
      forkJoin({
        cases: this.caseApi.getByLawyer(userId!).pipe(catchError(() => of([])))
      }).subscribe(({ cases }) => {
        this.stats.assignedCases = cases.length;
        this.stats.myActiveCases = (cases as any[]).filter((c: any) => c.status === 'ACTIVE').length;
        this.recentCases = (cases as any[]).slice(-5).reverse();
        
        // Fetch hearings for each case
        const allHearings: any[] = [];
        let pending = cases.length;
        if (pending === 0) {
          this.stats.totalHearings = 0;
          this.loading = false;
          return;
        }
        (cases as any[]).forEach(c => {
          this.hearingApi.getByCase(c.caseId).subscribe({
            next: caseHearings => {
              allHearings.push(...caseHearings);
              pending--;
              if (pending === 0) {
                this.stats.totalHearings = allHearings.length;
                this.recentHearings = allHearings.slice(-5).reverse();
                this.loading = false;
              }
            },
            error: () => {
              pending--;
              if (pending === 0) {
                this.stats.totalHearings = allHearings.length;
                this.recentHearings = allHearings.slice(-5).reverse();
                this.loading = false;
              }
            }
          });
        });
      });

    } else {
      // ADMIN, CLERK, COMPLIANCE, AUDITOR
      forkJoin({
        cases: this.caseApi.getAll().pipe(catchError(() => of([]))),
        hearings: this.hearingApi.getAll().pipe(catchError(() => of([]))),
        citizens: this.citizenApi.getAll().pipe(catchError(() => of([]))),
        judgments: this.judgmentApi.getAll().pipe(catchError(() => of([]))),
        orders: this.judgmentApi.getAllOrders().pipe(catchError(() => of([])))
      }).subscribe(({ cases, hearings, citizens, judgments, orders }) => {
        this.stats.totalCases = cases.length;
        this.stats.activeCases = (cases as any[]).filter((c: any) => c.status === 'ACTIVE').length;
        this.stats.underReview = (cases as any[]).filter((c: any) => c.status === 'UNDER_REVIEW').length;
        this.stats.totalHearings = hearings.length;
        this.stats.scheduledHearings = (hearings as any[]).filter((h: any) => h.status === 'SCHEDULED').length;
        this.stats.totalCitizens = citizens.length;
        this.stats.totalJudgments = judgments.length;
        this.stats.finalizedJudgments = (judgments as any[]).filter((j: any) => j.status === 'FINAL').length;
        this.stats.totalOrders = orders.length;
        this.recentCases = cases as any[];
        this.recentHearings = (hearings as any[]).slice(-5).reverse();
        this.loading = false;
      });
    }
  }

  badge(s: string): string {
    const m: Record<string,string> = {
      FILED:'bg-secondary', ACTIVE:'bg-success', CLOSED:'bg-dark',
      UNDER_REVIEW:'bg-warning text-dark', HEARING_SCHEDULED:'bg-info text-dark',
      JUDGMENT_PENDING:'bg-danger', DISMISSED:'bg-secondary',
      SCHEDULED:'bg-primary', COMPLETED:'bg-success',
      ADJOURNED:'bg-warning text-dark', CANCELLED:'bg-danger',
      DRAFT:'bg-warning text-dark', FINAL:'bg-success'
    };
    return m[s] ?? 'bg-secondary';
  }
}
