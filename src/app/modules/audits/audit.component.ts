import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserApiService, ComplianceApiService } from '../../core/services/api.service';
import { AuditResponse, UserResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit.component.html'
})
export class AuditComponent implements OnInit {
  audits: AuditResponse[] = [];
  officers: UserResponse[] = [];
  auditsLoading = true;
  showAuditForm = false;
  savingAudit = false;
  auditForm = { officerId: 0, scope: '', findings: '' };

  constructor(private complianceApi: ComplianceApiService, private userApi: UserApiService, private auth: AuthService) {}

  ngOnInit() {
    // Load officers first, then audits will be loaded in loadOfficers callback
    this.loadOfficers();
  }

  loadAudits() {
    this.auditsLoading = true;
    this.complianceApi.getAllAudits().subscribe({
      next: (data) => {
        // Map officer IDs to officer names if not already populated
        this.audits = data.map(audit => ({
          ...audit,
          officerName: audit.officerName || this.getOfficerName(audit.officerId)
        }));
        this.auditsLoading = false;
      },
      error: (err) => {
        console.error('Error loading audits:', err);
        this.auditsLoading = false;
      }
    });
  }

  getOfficerName(officerId: number): string {
    const officer = this.officers.find(o => o.userId === officerId);
    return officer ? officer.name : 'Unknown Officer';
  }

  loadOfficers() {
    this.userApi.getByRole('AUDITOR').subscribe({
      next: (data) => {
        this.officers = data;
        // After officers are loaded, reload audits to map officer names
        this.loadAudits();
      },
      error: (err) => {
        console.error('Error loading officers:', err);
        this.loadAudits(); // Still load audits even if officers fail
      }
    });
  }

  onAddAudit() {
    if (!this.auditForm.officerId || !this.auditForm.scope || !this.auditForm.findings) {
      alert('Please fill in all fields');
      return;
    }

    this.savingAudit = true;
    this.complianceApi.createAudit(this.auditForm).subscribe({
      next: (data) => {
        this.audits.unshift(data);
        this.resetForm();
        this.showAuditForm = false;
        this.savingAudit = false;
      },
      error: (err) => {
        console.error('Error creating audit:', err);
        this.savingAudit = false;
      }
    });
  }

  resetForm() {
    this.auditForm = { officerId: 0, scope: '', findings: '' };
  }

  onDeleteAudit(id: number) {
    if (confirm('Are you sure you want to delete this audit?')) {
      this.complianceApi.updateAuditStatus(id, 'deleted').subscribe({
        next: () => {
          this.audits = this.audits.filter(a => a.auditId !== id);
        },
        error: (err) => {
          console.error('Error deleting audit:', err);
        }
      });
    }
  }

  updateAuditStatus(auditId: number, event: any) {
    const newStatus = event.target.value;
    this.complianceApi.updateAuditStatus(auditId, newStatus).subscribe({
      next: (updatedAudit) => {
        const audit = this.audits.find(a => a.auditId === auditId);
        if (audit) {
          audit.status = updatedAudit.status;
        }
      },
      error: (err) => {
        console.error('Error updating audit status:', err);
      }
    });
  }

  auditBadge(status: string) {
    const badges: { [key: string]: string } = {
      'pending': 'bg-warning',
      'in_progress': 'bg-info',
      'completed': 'bg-success',
      'rejected': 'bg-danger'
    };
    return badges[status] || 'bg-secondary';
  }

  get isAdmin() {
    return this.auth.hasRole('ADMIN');
  }
}
