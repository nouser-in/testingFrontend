import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl:'./app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  loading = true;

  ngOnInit() {
    setTimeout(() => {
      this.loading = false;
    }, 0);
  }
}
