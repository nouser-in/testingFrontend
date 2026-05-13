import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  form = { name: '', email: '', password: '', phone: '' };
  loading = false;
  error = '';
  success = '';
  fieldErrors = { name: '', email: '', password: '', phone: '' };

  readonly emailPattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{3}$';
  readonly namePattern = '^[a-zA-Z\s]+$';
  readonly phonePattern = '^[0-9]{10}$';

  constructor(private auth: AuthService, private router: Router) {}

  resetFieldErrors(): void {
    this.fieldErrors = { name: '', email: '', password: '', phone: '' };
  }

  onInputChange(): void {
    if (this.error) {
      this.error = '';
    }
    if (this.success) {
      this.success = '';
    }
    this.resetFieldErrors();
  }

  onPhoneInput(): void {
    this.form.phone = this.form.phone.replace(/[^0-9]/g, '');
    this.onInputChange();
  }

  allowDigitsOnly(event: KeyboardEvent): void {
    const allowed = /[0-9]/;
    if (!allowed.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Tab') {
      event.preventDefault();
    }
  }

  validateForm(): boolean {
    this.resetFieldErrors();
    const nameTrim = this.form.name.trim();
    const emailTrim = this.form.email.trim();
    const phoneTrim = this.form.phone.trim();

    if (!nameTrim) {
      this.fieldErrors.name = 'Full name is required.';
    } else if (nameTrim.length < 4) {
      this.fieldErrors.name = 'Full name must be at least 4 characters.';
    } else if (nameTrim.length > 20) {
      this.fieldErrors.name = 'Full name cannot exceed 20 characters.';
    } else if (!new RegExp(this.namePattern).test(nameTrim)) {
      this.fieldErrors.name = 'Only letters and spaces are allowed.';
    }

    if (!emailTrim) {
      this.fieldErrors.email = 'Email is required.';
    } else if (!new RegExp(this.emailPattern).test(emailTrim)) {
      this.fieldErrors.email = 'Please enter a valid email address.';
    }

    if (!this.form.password) {
      this.fieldErrors.password = 'Password is required.';
    } else if (this.form.password.length < 6) {
      this.fieldErrors.password = 'Password must be at least 6 characters.';
    } else if (this.form.password.length > 16) {
      this.fieldErrors.password = 'Password cannot exceed 16 characters.';
    }

    if (!phoneTrim) {
      this.fieldErrors.phone = 'Phone number is required.';
    } else if (!new RegExp(this.phonePattern).test(phoneTrim)) {
      this.fieldErrors.phone = 'Phone number must be 10 digits.';
    }

    const hasErrors = Object.values(this.fieldErrors).some(Boolean);
    return !hasErrors;
  }

  private submitRegister(): void {
    this.auth.register(this.form as any).subscribe({
      next: () => {
        this.success = 'Account created successfully! Redirecting...';
        setTimeout(() => this.router.navigate(['/dashboard']), 1200);
      },
      error: (e) => {
        this.loading = false;
        const message = (e.error?.message || '').toString();
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('already') || lowerMessage.includes('exists')) {
          if (lowerMessage.includes('email')) {
            this.fieldErrors.email = 'Email already registered.';
          } else if (lowerMessage.includes('phone') || lowerMessage.includes('contact') || lowerMessage.includes('mobile')) {
            this.fieldErrors.phone = 'Phone number already registered.';
          } else {
            this.error = message;
          }
        } else if (lowerMessage.includes('invalid') && lowerMessage.includes('email')) {
          this.fieldErrors.email = 'Please enter a valid email address.';
        } else if (lowerMessage.includes('invalid') && (lowerMessage.includes('phone') || lowerMessage.includes('contact') || lowerMessage.includes('mobile'))) {
          this.fieldErrors.phone = 'Please enter a valid 10 digit phone number.';
        } else {
          this.error = message || 'Registration failed. Please try again.';
        }
      }
    });
  }

  onSubmit(): void {
    this.error = '';
    this.success = '';
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.submitRegister();
  }
}

