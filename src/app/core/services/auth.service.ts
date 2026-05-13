import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(this.getStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login`, req).pipe(
      tap(res => this.storeUser(res))
    );
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/register`, req).pipe(
      tap(res => this.storeUser(res))
    );
  }

  logout(): void {
    localStorage.removeItem('js_user');
    localStorage.removeItem('js_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  get currentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem('js_token');
  }

  get role(): string {
    return this.currentUser?.role ?? '';
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  hasRole(...roles: string[]): boolean {
    return roles.includes(this.role);
  }

  private storeUser(res: AuthResponse): void {
    localStorage.setItem('js_token', res.token);
    localStorage.setItem('js_user', JSON.stringify(res));
    this.currentUserSubject.next(res);
  }

  private getStoredUser(): AuthResponse | null {
    const u = localStorage.getItem('js_user');
    return u ? JSON.parse(u) : null;
  }
}
