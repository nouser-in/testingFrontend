import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuditLogApiService } from '../../core/services/api.service';
import { AuditLogResponse } from '../../shared/models/models';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl:"./audit-logs.html",
  styleUrl: "./audit-logs.scss"
})
export class AuditLogsComponent implements OnInit {
  logs: AuditLogResponse[] = [];
  filtered: AuditLogResponse[] = [];
  loading = true;
  lastUpdated = new Date();
  
  filterAction = '';
  filterResource = '';
  filterUserId: number | string | null = null;

  uniqueActions: string[] = [];
  uniqueResources: string[] = [];

  constructor(private auditApi: AuditLogApiService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.auditApi.getAll().subscribe({
      next: (data) => {
        this.logs = data.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        this.updateFilters();
        this.applyFilters();
        this.loading = false;
        this.lastUpdated = new Date();
      },
      error: (e) => {
        console.error('Error loading audit logs:', e);
        this.loading = false;
      }
    });
  }

  updateFilters(): void {
    this.uniqueActions = [...new Set(this.logs.map(l => l.action))].sort();
    this.uniqueResources = [...new Set(this.logs.map(l => l.resource))].sort();
  }

  applyFilters(): void {
    const userId = this.filterUserId == null || this.filterUserId === '' ? null : Number(this.filterUserId);

    this.filtered = this.logs.filter(log => {
      const matchAction = !this.filterAction || log.action === this.filterAction;
      const matchResource = !this.filterResource || log.resource === this.filterResource;
      const matchUserId = userId == null || log.userId === userId;
      return matchAction && matchResource && matchUserId;
    });
  }

  getUniqueUsers(): number {
    return new Set(this.logs.map(l => l.userId)).size;
  }

  getActionClass(action: string): string {
    const lower = action.toLowerCase();
    if (lower.includes('create') || lower.includes('post')) return 'create';
    if (lower.includes('update') || lower.includes('put') || lower.includes('patch')) return 'update';
    if (lower.includes('delete')) return 'delete';
    if (lower.includes('login') || lower.includes('auth')) return 'login';
    return 'read';
  }

  getResourceIcon(resource: string): string {
    const lower = resource.toLowerCase();
    if (lower.includes('user')) return 'bi-person';
    if (lower.includes('case')) return 'bi-folder';
    if (lower.includes('hearing')) return 'bi-calendar';
    if (lower.includes('judgment')) return 'bi-hammer';
    if (lower.includes('document')) return 'bi-file-text';
    if (lower.includes('audit')) return 'bi-shield-check';
    return 'bi-document';
  }

  refreshLogs(): void {
    this.loadLogs();
  }

  deleteLog(id: number): void {
    if (!confirm('Delete this audit log entry? This cannot be undone.')) return;
    this.auditApi.delete(id).subscribe({
      next: () => {
        this.logs = this.logs.filter(l => l.auditLogId !== id);
        this.updateFilters();
        this.applyFilters();
      },
      error: (e) => {
        console.error('Error deleting audit log:', e);
      }
    });
  }

  deleteAllLogs(): void {
    if (!confirm('Delete all audit logs? This will remove the entire audit history.')) return;
    this.auditApi.deleteAll().subscribe({
      next: () => {
        this.logs = [];
        this.filtered = [];
      },
      error: (e) => {
        console.error('Error deleting all audit logs:', e);
      }
    });
  }
}
