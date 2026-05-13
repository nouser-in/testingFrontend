import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CitizenApiService, CaseApiService } from '../../core/services/api.service';
import { CitizenResponse, DocumentResponse, CaseResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-citizen-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl:"./citizen-detail.html"
})
export class CitizenDetailComponent implements OnInit {
  citizen!: CitizenResponse;
  documents: DocumentResponse[] = [];
  cases: CaseResponse[] = [];
  loading = true;
  showDocForm = false;
  docType = '';
  fileUri = '';
  docTypes = ['PETITION','EVIDENCE','ORDER','ID_PROOF','LEGAL_DOC'];

  constructor(
    private route: ActivatedRoute,
    private api: CitizenApiService,
    private caseApi: CaseApiService,
    private auth: AuthService
  ) {}

  get isLawyer(): boolean { return this.auth.hasRole('LAWYER'); }

  get filteredCases(): CaseResponse[] {
    if (!this.isLawyer) return this.cases;
    // For lawyers, show only cases where they are the assigned lawyer
    const userId = this.auth.currentUser?.userId;
    return this.cases.filter(c => (c as any).lawyerId === userId);
  }

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.api.getById(id).subscribe(c => { this.citizen = c; this.loading = false; });
    this.api.getDocuments(id).subscribe(d => this.documents = d);
    this.caseApi.getByCitizen(id).subscribe(c => this.cases = c);
  }

  addDoc(): void {
    if (!this.docType || !this.fileUri) return;
    this.api.addDocument(this.citizen.citizenId, { docType: this.docType, fileUri: this.fileUri } as any).subscribe(d => {
      this.documents = [...this.documents, d];
      this.showDocForm = false;
      this.docType = ''; this.fileUri = '';
    });
  }

  verify(docId: number, status: string): void {
    this.api.verifyDocument(this.citizen.citizenId, docId, status).subscribe(d => {
      this.documents = this.documents.map(x => x.documentId === docId ? d : x);
    });
  }

  getFileName(fileUri: string): string {
    if (!fileUri) return 'document';
    const parts = fileUri.split('/');
    const raw = parts[parts.length - 1];
    const match = raw.match(/^\d+_[a-f0-9]+\.(.+)$/);
    return match ? `document.${match[1]}` : raw;
  }

  fileIcon(fileUri: string): string {
    const ext = (fileUri || '').split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return 'bi-file-earmark-pdf text-danger';
    if (['jpg','jpeg','png'].includes(ext)) return 'bi-file-earmark-image text-success';
    if (['doc','docx'].includes(ext)) return 'bi-file-earmark-word text-primary';
    return 'bi-file-earmark';
  }

  vbadge(s: string): string {
    return s === 'VERIFIED' ? 'bg-success' : s === 'REJECTED' ? 'bg-danger' : 'bg-warning text-dark';
  }
}
