import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CaseApiService, CitizenApiService, UserApiService, NotificationApiService
} from '../../core/services/api.service';
import { CitizenResponse, UserResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-case-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './case-form.html'
})
export class CaseFormComponent implements OnInit {
  form = { title: '', description: '', citizenId: 0, lawyerId: null as number | null };

  citizens: CitizenResponse[] = [];
  clerks: UserResponse[] = [];
  allLawyers: UserResponse[] = [];
  filteredLawyers: UserResponse[] = [];

  hasLawyer = false;
  lawyerSearch = '';
  selectedLawyerId: number | null = null;
  selectedLawyerName = '';
  loadingLawyers = false;
  lawyerLoadError = '';

  loading = false;
  error = '';
  success = '';

  constructor(
    private api: CaseApiService,
    private citizenApi: CitizenApiService,
    private userApi: UserApiService,
    private notifApi: NotificationApiService,
    public auth: AuthService,
    private router: Router
  ) {}

  get isCitizen(): boolean { return this.auth.hasRole('CITIZEN'); }

  ngOnInit(): void {
    if (this.isCitizen) {
      this.citizenApi.getByUserId(this.auth.currentUser!.userId).subscribe({
        next: c => this.form.citizenId = c.citizenId,
        error: () => this.error = 'Please complete your citizen profile before filing a case.'
      });
    } else {
      this.citizenApi.getAll().subscribe({ next: d => this.citizens = d, error: () => {} });
    }
    this.userApi.getByRole('CLERK').subscribe({ next: d => this.clerks = d, error: () => {} });
  }

  onLawyerToggle(): void {
    if (this.hasLawyer) {
      this.loadLawyers();
    } else {
      this.clearLawyer();
    }
  }

  loadLawyers(): void {
    this.loadingLawyers = true;
    this.lawyerLoadError = '';
    this.allLawyers = [];
    this.filteredLawyers = [];

    this.userApi.getByRole('LAWYER').subscribe({
      next: data => {
        this.allLawyers = data;
        this.filteredLawyers = [...data]; // ← KEY FIX: always populate filteredLawyers on load
        this.loadingLawyers = false;
      },
      error: err => {
        this.lawyerLoadError = `Could not load lawyers (${err.status || 'network error'}). Check that the API gateway is running on port 9090.`;
        this.loadingLawyers = false;
      }
    });
  }

  filterLawyers(): void {
    const q = this.lawyerSearch.toLowerCase().trim();
    this.filteredLawyers = !q
      ? [...this.allLawyers]
      : this.allLawyers.filter(l =>
          l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
        );
  }

  clearSearch(): void {
    this.lawyerSearch = '';
    this.filteredLawyers = [...this.allLawyers];
  }

  selectLawyer(l: UserResponse): void {
    this.selectedLawyerId = l.userId;
    this.selectedLawyerName = l.name;
    this.form.lawyerId = l.userId;
  }

  clearLawyer(): void {
    this.selectedLawyerId = null;
    this.selectedLawyerName = '';
    this.form.lawyerId = null;
    this.lawyerSearch = '';
    this.filteredLawyers = [...this.allLawyers];
  }

  onSubmit(): void {
    if (!this.form.citizenId) {
      this.error = 'Citizen profile not found. Please complete your profile first.';
      return;
    }
    if (!this.form.title.trim()) {
      this.error = 'Case title is required.';
      return;
    }
    if (this.hasLawyer && !this.selectedLawyerId) {
      this.error = 'You enabled "I have a lawyer" but did not select one. Please select a lawyer or disable the option.';
      return;
    }

    this.loading = true;
    this.error = '';

    const payload: any = {
      citizenId: this.form.citizenId,
      title: this.form.title,
      description: this.form.description
    };
    if (this.form.lawyerId) payload.lawyerId = this.form.lawyerId;

    this.api.file(payload).subscribe({
      next: c => {
        if (!this.form.lawyerId) {
          this.clerks.forEach(clerk => {
            this.notifApi.create({
              userId: clerk.userId,
              entityId: c.caseId,
              category: 'CASE',
              message: `New case filed: "${c.title}" (Case #${c.caseId}) by ${c.citizenName}. Please assign a lawyer.`
            }).subscribe();
          });
          this.success = `Case #${c.caseId} filed! The clerk will assign a lawyer and notify you.`;
        } else {
          this.success = `Case #${c.caseId} filed! Lawyer ${this.selectedLawyerName} has been notified.`;
        }
        this.loading = false;
        setTimeout(() => this.router.navigate(['/cases', c.caseId]), 1800);
      },
      error: e => {
        this.error = e.error?.message || 'Failed to file case. Please try again.';
        this.loading = false;
      }
    });
  }
}
