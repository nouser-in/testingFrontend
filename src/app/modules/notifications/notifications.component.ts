import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationApiService } from '../../core/services/api.service';
import { NotificationResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: "./notification.html",
  // inline ngModel fix for non-form context
  styleUrl: "./notification.scss"
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationResponse[] = [];
  filtered: NotificationResponse[] = [];
  loading = true;
  filterCat = '';
  selectedNotification: NotificationResponse | null = null;
  notificationDetailLines: string[] = [];

  constructor(private api: NotificationApiService, private auth: AuthService) {}

  get unreadCount() { return this.filtered.filter(n => n.status === 'UNREAD').length; }
  get unread() { return this.filtered.filter(n => n.status === 'UNREAD'); }
  get read() { return this.filtered.filter(n => n.status !== 'UNREAD'); }

  ngOnInit(): void {
    const userId = this.auth.currentUser?.userId;
    if (userId) {
      this.api.getByUser(userId).subscribe({
        next: d => {
          this.notifications = d.sort((a, b) =>
            new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
          );
          this.applyFilter();
          this.loading = false;
        },
        error: () => this.loading = false
      });
    } else { this.loading = false; }
  }

  applyFilter(): void {
    this.filtered = this.notifications.filter(n =>
      !this.filterCat || n.category === this.filterCat
    );
  }

  markRead(n: NotificationResponse): void {
    this.api.markRead(n.notificationId).subscribe(updated => {
      this.notifications = this.notifications.map(x =>
        x.notificationId === n.notificationId ? updated : x
      );
      this.applyFilter();
    });
  }

  markAllRead(): void {
    const userId = this.auth.currentUser?.userId;
    if (!userId) return;

    // Try bulk endpoint first; fallback to one-by-one
    this.api.markAllRead(userId).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => ({ ...n, status: 'READ' }));
        this.applyFilter();
      },
      error: () => {
        // Fallback: mark each unread one individually
        this.unread.forEach(n => this.markRead(n));
      }
    });
  }

  catTitle(cat: string): string {
    const m: Record<string, string> = {
      CASE: '📁 Case Update',
      DOCUMENT_REQUEST: '📄 Document Request',
      HEARING: '📅 Hearing Notice',
      JUDGMENT: '⚖️ Judgment Update',
      COMPLIANCE: '🛡️ Compliance Alert'
    };
    return m[cat] ?? '🔔 Notification';
  }

  catColor(cat: string): string {
    const m: Record<string, string> = {
      CASE: '#0d6efd', 
      DOCUMENT_REQUEST: '#fd7e14',
      HEARING: '#0dcaf0', 
      JUDGMENT: '#ffc107', 
      COMPLIANCE: '#198754'
    };
    return m[cat] ?? '#6c757d';
  }

  catBg(cat: string): string {
    const m: Record<string, string> = {
      CASE: 'bg-primary text-white',
      DOCUMENT_REQUEST: 'bg-warning text-dark',
      HEARING: 'bg-info text-dark',
      JUDGMENT: 'bg-warning text-dark',
      COMPLIANCE: 'bg-success text-white'
    };
    return m[cat] ?? 'bg-secondary text-white';
  }

  catIcon(cat: string): string {
    const m: Record<string, string> = {
      CASE: 'bi-folder2-open',
      DOCUMENT_REQUEST: 'bi-file-earmark-text',
      HEARING: 'bi-calendar-event',
      JUDGMENT: 'bi-hammer',
      COMPLIANCE: 'bi-shield-check'
    };
    return m[cat] ?? 'bi-bell';
  }

  isDocumentRequest(n: NotificationResponse): boolean {
    return n.message.toLowerCase().includes('document request') || n.message.toLowerCase().includes('reply to document request');
  }

  viewMessage(n: NotificationResponse): void {
    this.selectedNotification = n;
    this.notificationDetailLines = n.message?.split('\n') || [];
    this.markRead(n);
  }

  closeMessage(): void {
    this.selectedNotification = null;
    this.notificationDetailLines = [];
  }
}

