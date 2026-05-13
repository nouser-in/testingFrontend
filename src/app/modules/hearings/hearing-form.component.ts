import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HearingApiService, CaseApiService, UserApiService, NotificationApiService, CitizenApiService } from '../../core/services/api.service';
import { CaseResponse, UserResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-hearing-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl:"./hearing-form.html"
})
export class HearingFormComponent implements OnInit {
  form = { caseId: 0, judgeId: 0, date: '', time: '' };
  cases: CaseResponse[] = [];
  judges: UserResponse[] = [];
  selectedCase: CaseResponse | null = null;
  loading = false;
  error = '';
  success = '';

  constructor(
    private api: HearingApiService,
    private caseApi: CaseApiService,
    private userApi: UserApiService,
    private citizenApi: CitizenApiService, // ADD THIS
  private notifApi: NotificationApiService,
    private router: Router,
    private route: ActivatedRoute,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.caseApi.getAll().subscribe({ next: d => { this.cases = d.filter(c => c.status !== 'CLOSED' && c.status !== 'DISMISSED'); }, error: () => {} });
    this.userApi.getByRole('JUDGE').subscribe({ next: d => this.judges = d, error: () => {} });

    // Pre-fill from query params (e.g. from case detail page)
    const caseIdParam = this.route.snapshot.queryParams['caseId'];
    if (caseIdParam) {
      this.form.caseId = +caseIdParam;
      this.caseApi.getById(+caseIdParam).subscribe({ next: c => this.selectedCase = c, error: () => {} });
    }

    // Pre-fill judge if current user is a judge
    if (this.auth.hasRole('JUDGE')) {
      this.form.judgeId = this.auth.currentUser!.userId;
    }
  }

  onCaseChange(): void {
    const c = this.cases.find(x => x.caseId === +this.form.caseId);
    this.selectedCase = c || null;
  }

  onSubmit(): void {
    if (!this.form.caseId || !this.form.judgeId || !this.form.date || !this.form.time) {
      this.error = 'Please fill all required fields.';
      return;
    }
    this.loading = true;
    this.error = '';

    // Build payload with ALL required fields that the backend expects
    const payload: any = {
      caseId: +this.form.caseId,
      judgeId: +this.form.judgeId,
      date: this.form.date,
      time: this.form.time,
      caseTitle: this.selectedCase?.title || `Case #${this.form.caseId}`,
      // citizenUserId comes from the citizen who owns the case
      // The hearing-service requires this for notifications
      citizenUserId: this.selectedCase?.citizenId || null,
    };

    if (this.selectedCase?.lawyerId) {
      payload.lawyerUserId = this.selectedCase.lawyerId;
    }

    this.api.schedule(payload).subscribe({
      next: h => {
        this.success = `Hearing #${h.hearingId} scheduled for ${h.date} at ${h.time}!`;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/hearings']), 1500);
      },
      error: e => {
        this.error = e.error?.message || 'Failed to schedule hearing. Check all fields.';
        this.loading = false;
      }
    });
  }
}
