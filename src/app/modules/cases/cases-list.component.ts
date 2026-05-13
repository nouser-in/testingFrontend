import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CaseApiService, CitizenApiService } from '../../core/services/api.service';
import { CaseResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-cases-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl:"./cases-list.html"
})
export class CasesListComponent implements OnInit {
  cases: CaseResponse[] = [];
  filtered: CaseResponse[] = [];
  loading = true;
  searchTerm = '';
  filterStatus = '';
  filterAssigned = '';
  statuses = ['FILED', 'UNDER_REVIEW', 'ACTIVE', 'HEARING_SCHEDULED', 'JUDGMENT_PENDING', 'CLOSED', 'DISMISSED'];

  constructor(
    private api: CaseApiService,
    private citizenApi: CitizenApiService,
    private route: ActivatedRoute,
    public auth: AuthService
  ) {}

  get isCitizen() { return this.auth.hasRole('CITIZEN'); }
  get isLawyer() { return this.auth.hasRole('LAWYER'); }
  get isClerk() { return this.auth.hasRole('CLERK'); }
  get isAdmin() { return this.auth.hasRole('ADMIN'); }
  get isJudge() { return this.auth.hasRole('JUDGE'); }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.filterStatus = params.get('status') || '';
      this.applyFilter();
    });

    const userId = this.auth.currentUser?.userId;
    if (!userId) { this.loading = false; return; }

    if (this.isCitizen) {
      // Citizen: get their citizen profile first, then fetch their cases
      this.citizenApi.getByUserId(userId).subscribe({
        next: citizen => {
          this.api.getByCitizen(citizen.citizenId).subscribe({
            next: d => { this.cases = d; this.applyFilter(); this.loading = false; },
            error: () => this.loading = false
          });
        },
        error: () => {
          // Fallback: show all (profile not created yet)
          this.api.getAll().subscribe({
            next: d => { this.cases = d.filter(c => c.citizenName === this.auth.currentUser?.name); this.applyFilter(); this.loading = false; },
            error: () => this.loading = false
          });
        }
      });
    } else if (this.isLawyer) {
      // Lawyer: only cases assigned to them
      this.api.getByLawyer(userId).subscribe({
        next: d => { this.cases = d; this.applyFilter(); this.loading = false; },
        error: () => {
          // fallback: filter all cases by lawyerId
          this.api.getAll().subscribe({
            next: all => {
              this.cases = all.filter(c => c.lawyerId === userId);
              this.applyFilter();
              this.loading = false;
            },
            error: () => this.loading = false
          });
        }
      });
    } else if (this.isJudge) {
      // Judge: only cases assigned to them
      this.api.getAll().subscribe({
        next: all => {
          this.cases = all.filter(c => c.judgeId === userId);
          this.applyFilter();
          this.loading = false;
        },
        error: () => this.loading = false
      });
    } else {
      // Clerk, Admin, Compliance: see all cases
      this.api.getAll().subscribe({
        next: d => { this.cases = d; this.applyFilter(); this.loading = false; },
        error: () => this.loading = false
      });
    }
  }

  applyFilter(): void {
    this.filtered = this.cases.filter(c => {
      const matchStatus = !this.filterStatus || c.status === this.filterStatus;
      const matchSearch = !this.searchTerm ||
        c.title?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.citizenName?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchAssigned = !this.filterAssigned ||
        (this.filterAssigned === 'assigned' ? !!c.lawyerName : !c.lawyerName);
      return matchStatus && matchSearch && matchAssigned;
    });
  }

  badge(s: string): string {
    const m: Record<string, string> = {
      FILED: 'bg-secondary', ACTIVE: 'bg-success', CLOSED: 'bg-dark',
      UNDER_REVIEW: 'bg-warning text-dark', HEARING_SCHEDULED: 'bg-info text-dark',
      JUDGMENT_PENDING: 'bg-danger', DISMISSED: 'bg-secondary'
    };
    return m[s] ?? 'bg-secondary';
  }
}
