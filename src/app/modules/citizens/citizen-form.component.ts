import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CitizenApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-citizen-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl:"./citizen-form.html"
})
export class CitizenFormComponent implements OnInit {
  form = { userId: 0, name: '', dob: '', gender: '', address: '', contactInfo: '' };
  loading = false;
  error = '';
  success = '';

  constructor(
    private api: CitizenApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  get currentUserName(): string { return this.auth.currentUser?.name ?? ''; }
  get currentUserEmail(): string { return this.auth.currentUser?.email ?? ''; }

  ngOnInit(): void {
    // Auto-fill userId from logged-in session — no dropdown needed
    this.form.userId = this.auth.currentUser?.userId ?? 0;
    this.form.name = this.auth.currentUser?.name ?? '';
  }

  validateDob(): void {
    // Trigger change detection for validation display
  }

  get isDobAdult(): boolean {
    if (!this.form.dob) return false;

    let birthDate: Date;

    // Try to parse the date - handle both YYYY-MM-DD and DD-MM-YYYY formats
    if (this.form.dob.includes('-')) {
      const parts = this.form.dob.split('-');
      if (parts.length === 3) {
        // Check if it's DD-MM-YYYY format (European style)
        if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
          // Convert DD-MM-YYYY to YYYY-MM-DD
          birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          // Assume it's already YYYY-MM-DD
          birthDate = new Date(this.form.dob);
        }
      } else {
        birthDate = new Date(this.form.dob);
      }
    } else {
      birthDate = new Date(this.form.dob);
    }

    const today = new Date();

    // Check if date is valid and not in the future
    if (isNaN(birthDate.getTime()) || birthDate > today) {
      return false;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // If birthday hasn't occurred this year yet, subtract 1 from age
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age = age - 1;
    }

    return age >= 18;
  }

  get ageValidationMessage(): string {
    if (!this.form.dob) return '';

    let birthDate: Date;

    // Try to parse the date - handle both YYYY-MM-DD and DD-MM-YYYY formats
    if (this.form.dob.includes('-')) {
      const parts = this.form.dob.split('-');
      if (parts.length === 3) {
        // Check if it's DD-MM-YYYY format (European style)
        if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
          // Convert DD-MM-YYYY to YYYY-MM-DD
          birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          // Assume it's already YYYY-MM-DD
          birthDate = new Date(this.form.dob);
        }
      } else {
        birthDate = new Date(this.form.dob);
      }
    } else {
      birthDate = new Date(this.form.dob);
    }

    if (isNaN(birthDate.getTime())) {
      return 'Please enter a valid date of birth';
    }

    if (birthDate > new Date()) {
      return 'Date of birth cannot be in the future';
    }

    if (!this.isDobAdult) {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age = age - 1;
      }
      return `Age must be 18 years or above. Current age: ${age} years`;
    }

    return '';
  }

  onSubmit(): void {
    if (!this.form.dob) {
      this.error = 'Date of birth is required';
      return;
    }

    if (!this.isDobAdult) {
      this.error = this.ageValidationMessage || 'You must be 18 years or older to create a citizen profile';
      return;
    }

    this.loading = true;
    this.error = '';
    this.api.create(this.form as any).subscribe({
      next: c => {
        this.success = 'Profile registered successfully! Redirecting...';
        setTimeout(() => this.router.navigate(['/citizens', c.citizenId]), 1200);
      },
      error: e => {
        this.error = e.error?.message || 'Failed to register profile';
        this.loading = false;
      }
    });
  }
}
