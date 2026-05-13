import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationApiService } from '../../core/services/api.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: "./layout.html"
})
export class LayoutComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  currentTime = new Date();
  private timerSub?: Subscription;
  private notifSub?: Subscription;

  constructor(private auth: AuthService, private notifApi: NotificationApiService) {}

  get userName(): string { return this.auth.currentUser?.name ?? ''; }
  get userRole(): string { return this.auth.currentUser?.role ?? ''; }
  get initials(): string { return this.userName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(); }

  get isAdmin(): boolean { return this.auth.hasRole('ADMIN'); }
  get isJudge(): boolean { return this.auth.hasRole('JUDGE'); }
  get isClerk(): boolean { return this.auth.hasRole('CLERK'); }
  get isLawyer(): boolean { return this.auth.hasRole('LAWYER'); }
  get isCitizen(): boolean { return this.auth.hasRole('CITIZEN'); }
  get isCompliance(): boolean { return this.auth.hasRole('COMPLIANCE'); }
  get isAuditor(): boolean { return this.auth.hasRole('AUDITOR'); }

  ngOnInit(): void {
    this.timerSub = interval(1000).subscribe(() => this.currentTime = new Date());
    const userId = this.auth.currentUser?.userId;
    if (userId) {
      this.pollNotifications(userId);
      this.notifSub = interval(30000).pipe(
        switchMap(() => this.notifApi.countUnread(userId))
      ).subscribe(c => this.unreadCount = c);
    }
  }

  pollNotifications(userId: number): void {
    this.notifApi.countUnread(userId).subscribe(c => this.unreadCount = c, () => {});
  }

  logout(): void { this.auth.logout(); }

  ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
    this.notifSub?.unsubscribe();
  }
}
