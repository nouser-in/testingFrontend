import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplianceApiService, UserApiService } from '../../core/services/api.service';
import { ComplianceRecordResponse, AuditResponse, UserResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-compliance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compliance.html'
})
export class ComplianceComponent implements OnInit {
  tab = 'compliance';
  records: ComplianceRecordResponse[] = [];
  audits: AuditResponse[] = [];
  officers: UserResponse[] = [];
  loading = true;
  auditsLoading = true;
  showRecordForm = false;
  showAuditForm = false;
  recForm = { entityId: 0, type: '', result: '', notes: '' };
  auditForm = { officerId: 0, scope: '', findings: '' };
  toast: { msg: string; type: 'success' | 'error' } | null = null;

  constructor(private api: ComplianceApiService, private userApi: UserApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.api.getAllRecords().subscribe({ next: d => { this.records = d; this.loading = false; }, error: () => this.loading = false });
    
    // Load officers first, then audits to map officer names
    this.userApi.getAll().subscribe({
      next: d => {
        this.officers = d.filter(u => ['COMPLIANCE','AUDITOR','ADMIN'].includes(u.role));
        // After officers loaded, load and enrich audits with officer names
        this.loadAuditsWithOfficerNames();
      },
      error: (e) => {
        console.error('Error loading officers:', e);
        this.officers = [];
        this.showToast('Failed to load officers - backend error', 'error');
        // Still try to load audits even if officers fail
        this.loadAuditsWithOfficerNames();
      }
    });
  }

  loadAuditsWithOfficerNames(): void {
    this.api.getAllAudits().subscribe({
      next: d => {
        // Map officer IDs to officer names
        this.audits = d.map(audit => ({
          ...audit,
          officerName: audit.officerName || this.getOfficerName(audit.officerId)
        }));
        this.auditsLoading = false;
      },
      error: () => this.auditsLoading = false
    });
  }

  getOfficerName(officerId: number): string {
    const officer = this.officers.find(o => o.userId === officerId);
    return officer ? officer.name : 'Unknown Officer';
  }

  addRecord(): void {
    if (!this.recForm.type || !this.recForm.result) {
      this.showToast('Please fill in Type and Result fields', 'error');
      return;
    }
    console.log('Creating compliance record:', this.recForm);
    this.api.createRecord(this.recForm as any).subscribe({
      next: r => {
        console.log('Record created successfully:', r);
        this.records = [...this.records, r];
        this.showRecordForm = false;
        this.recForm = { entityId: 0, type: '', result: '', notes: '' };
        this.showToast('Record added successfully', 'success');
      },
      error: (e) => {
        console.error('Error creating record:', e);
        this.showToast('Failed to add record: ' + (e.error?.message || e.message), 'error');
      }
    });
  }

  addAudit(): void {
    if (!this.auditForm.scope || !this.auditForm.officerId) {
      this.showToast('Please select Officer and enter Scope', 'error');
      return;
    }
    console.log('Creating audit:', this.auditForm);
    this.api.createAudit(this.auditForm as any).subscribe({
      next: a => {
        console.log('Audit created successfully:', a);
        // Map officer name before adding to list
        const auditWithOfficer = {
          ...a,
          officerName: a.officerName || this.getOfficerName(a.officerId)
        };
        this.audits = [...this.audits, auditWithOfficer];
        this.showAuditForm = false;
        this.auditForm = { officerId: 0, scope: '', findings: '' };
        this.showToast('Audit added successfully', 'success');
      },
      error: (e) => {
        console.error('Error creating audit:', e);
        this.showToast('Failed to add audit: ' + (e.error?.message || e.message), 'error');
      }
    });
  }

  updateAuditStatus(id: number, status: string): void {
    console.log('Updating audit status:', id, status);
    this.api.updateAuditStatus(id, status).subscribe({
      next: a => {
        console.log('Audit status updated:', a);
        this.audits = this.audits.map(x => x.auditId === id ? a : x);
        this.showToast('Status updated successfully', 'success');
      },
      error: (e) => {
        console.error('Error updating audit status:', e);
        this.showToast('Failed to update status', 'error');
      }
    });
  }

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { msg, type };
    setTimeout(() => this.toast = null, 4000);
  }

  resultBadge(s: string): string {
    return s === 'COMPLIANT' ? 'bg-success' : s === 'NON_COMPLIANT' ? 'bg-danger' : 'bg-warning text-dark';
  }
  auditBadge(s: string): string {
    return s === 'CLOSED' ? 'bg-success' : s === 'REVIEW' ? 'bg-warning text-dark' : 'bg-primary';
  }
}
