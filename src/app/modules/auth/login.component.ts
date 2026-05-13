import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  loading = false;
  error = '';
  emailPattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{3}$';

  loginFormData = { email: '', password: '' };

  constructor(private auth: AuthService, private router: Router) {}

  onInputChange(): void {
    if (this.error) {
      this.error = '';
    }
  }

  onLoginSubmit(loginForm: NgForm): void {
    if (loginForm.invalid) {
      this.error = 'Please enter a valid email and password before signing in.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.auth.login(this.loginFormData).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.error = e.error?.message || 'Invalid credentials';
        this.loading = false;
        setTimeout(() => {
          this.error = '';
        }, 3000);
      }
    });
  }
}
