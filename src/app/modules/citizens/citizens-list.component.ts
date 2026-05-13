import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CitizenApiService, CaseApiService } from '../../core/services/api.service';
import { CitizenResponse } from '../../shared/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-citizens-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl:"./citizens-list.html"
})
export class CitizensListComponent implements OnInit {
  citizens: CitizenResponse[] = [];
  loading = true;
  search = '';

  constructor(private api: CitizenApiService, private caseApi: CaseApiService, private auth: AuthService) {}

  get isLawyer(): boolean { return this.auth.hasRole('LAWYER'); }

  get filtered(): CitizenResponse[] {
    return this.citizens.filter(c =>
      !this.search || c.name?.toLowerCase().includes(this.search.toLowerCase())
    );
  }

  ngOnInit(): void {
    if (this.isLawyer) {
      // For lawyers, fetch their cases and then get the citizens from those cases
      const userId = this.auth.currentUser?.userId;
      if (!userId) { this.loading = false; return; }
      this.caseApi.getByLawyer(userId).subscribe({
        next: cases => {
          const citizenIds = new Set((cases as any[]).map(c => c.citizenId));
          this.api.getAll().subscribe({
            next: allCitizens => {
              this.citizens = (allCitizens as any[]).filter(c => citizenIds.has(c.citizenId));
              this.loading = false;
            },
            error: () => this.loading = false
          });
        },
        error: () => this.loading = false
      });
    } else {
      this.api.getAll().subscribe({ next: d => { this.citizens = d; this.loading = false; }, error: () => this.loading = false });
    }
  }
}
