import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserApiService } from '../../core/services/api.service';
import { UserResponse } from '../../shared/models/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./users.html"
})
export class UsersComponent implements OnInit {
  users: UserResponse[] = [];
  loading = true;
  search = '';
  filterRole = '';
  filterStatus = '';
  savingRole: number | null = null;
  toast: { msg: string; type: 'success' | 'error' } | null = null;

  // tracks selected role per user in the dropdown
  roleSelections: Record<number, string> = {};

  roles = ['CITIZEN', 'LAWYER', 'JUDGE', 'CLERK', 'ADMIN', 'COMPLIANCE', 'AUDITOR'];

  constructor(private api: UserApiService) {}

  get filtered(): UserResponse[] {
    return this.users.filter(u =>
      (!this.filterRole   || u.role   === this.filterRole) &&
      (!this.filterStatus || u.status === this.filterStatus) &&
      (!this.search ||
        u.name.toLowerCase().includes(this.search.toLowerCase()) ||
        u.email.toLowerCase().includes(this.search.toLowerCase()))
    );
  }

  ngOnInit(): void {
    this.api.getAll().subscribe({
      next: d => {
        this.users = d;
        // pre-populate role dropdown with current role
        d.forEach(u => this.roleSelections[u.userId] = u.role);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  changeRole(u: UserResponse): void {
    const newRole = this.roleSelections[u.userId];
    if (!newRole || newRole === u.role) return;

    if (!confirm(`Change ${u.name}'s role from ${u.role} to ${newRole}?\n\nThe user will need to log out and log back in to access their new portal.`)) {
      this.roleSelections[u.userId] = u.role; // reset dropdown
      return;
    }

    this.savingRole = u.userId;
    this.api.updateRole(u.userId, newRole).subscribe({
      next: updated => {
        this.users = this.users.map(x => x.userId === u.userId ? updated : x);
        this.roleSelections[u.userId] = updated.role;
        this.savingRole = null;
        this.showToast(`${updated.name}'s role changed to ${updated.role}. Ask them to log out and log back in.`, 'success');
      },
      error: (e) => {
        this.savingRole = null;
        this.roleSelections[u.userId] = u.role; // reset on error
        this.showToast(e.error?.message || 'Failed to change role. Please try again.', 'error');
      }
    });
  }

  toggleStatus(u: UserResponse): void {
    const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = newStatus === 'INACTIVE' ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${u.name}?`)) return;
    this.api.updateStatus(u.userId, newStatus).subscribe(updated => {
      this.users = this.users.map(x => x.userId === u.userId ? updated : x);
      this.showToast(`${updated.name} has been ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`, 'success');
    });
  }

  deleteUser(id: number): void {
    const u = this.users.find(x => x.userId === id);
    if (!confirm(`Permanently delete ${u?.name}? This cannot be undone.`)) return;
    this.api.delete(id).subscribe(() => {
      this.users = this.users.filter(u => u.userId !== id);
      this.showToast('User deleted.', 'success');
    });
  }

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { msg, type };
    setTimeout(() => this.toast = null, 4000);
  }

  roleBadge(role: string): string {
    const m: Record<string, string> = {
      ADMIN: 'bg-danger', JUDGE: 'bg-primary', LAWYER: 'bg-info text-dark',
      CLERK: 'bg-warning text-dark', CITIZEN: 'bg-secondary',
      COMPLIANCE: 'bg-success', AUDITOR: 'bg-dark'
    };
    return m[role] ?? 'bg-secondary';
  }

  roleAvatarBg(role: string): string {
    const m: Record<string, string> = {
      ADMIN: 'bg-danger', JUDGE: 'bg-primary', LAWYER: 'bg-info',
      CLERK: 'bg-warning', CITIZEN: 'bg-secondary',
      COMPLIANCE: 'bg-success', AUDITOR: 'bg-dark'
    };
    return m[role] ?? 'bg-secondary';
  }

  roleIcon(role: string): string {
    const m: Record<string, string> = {
      ADMIN: 'bi-shield-fill', JUDGE: 'bi-person-badge',
      LAWYER: 'bi-briefcase-fill', CLERK: 'bi-clipboard-fill',
      CITIZEN: 'bi-person-fill', COMPLIANCE: 'bi-shield-check',
      AUDITOR: 'bi-search'
    };
    return m[role] ?? 'bi-person';
  }

  rolePortalName(role: string): string {
    const m: Record<string, string> = {
      ADMIN: 'Admin Panel', JUDGE: 'Judge Console', LAWYER: 'Lawyer Dashboard',
      CLERK: 'Clerk Panel', CITIZEN: 'Citizen Portal',
      COMPLIANCE: 'Compliance Console', AUDITOR: 'Auditor Dashboard'
    };
    return m[role] ?? role;
  }
}
