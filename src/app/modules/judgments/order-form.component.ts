import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { JudgmentApiService, CaseApiService, UserApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CaseResponse, UserResponse } from '../../shared/models/models';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./order-form.html"
})
export class OrderFormComponent implements OnInit {
  form = { caseId: 0, judgeId: 0, description: '' };
  cases: CaseResponse[] = [];
  judges: UserResponse[] = [];
  loading = false; error = ''; success = '';

  constructor(private api: JudgmentApiService, private caseApi: CaseApiService, private userApi: UserApiService, public auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.caseApi.getAll().subscribe(cases => {
      if (this.auth.role === 'JUDGE') {
        this.cases = cases.filter(c => c.judgeId === this.auth.currentUser?.userId);
        this.form.judgeId = this.auth.currentUser?.userId || 0;
      } else {
        this.cases = cases;
      }
    });
    if (this.auth.role !== 'JUDGE') {
      this.userApi.getByRole('JUDGE').subscribe(d => this.judges = d);
    }
  }

  onSubmit(): void {
    this.loading = true; this.error = '';
    this.api.issueOrder(this.form as any).subscribe({
      next: o => { this.success = `Order #${o.orderId} issued!`; setTimeout(() => this.router.navigate(['/judgments']), 1200); },
      error: e => { this.error = e.error?.message || 'Failed'; this.loading = false; }
    });
  }
}
