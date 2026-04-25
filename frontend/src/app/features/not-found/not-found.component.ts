// src/app/features/not-found/not-found.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="main main--error">
      <h2><i class="fas fa-triangle-exclamation"></i> ERROR 404</h2>
      <p>No te hagas el distraído, le erraste de página como le erraste al arco.</p>
      <br>
      <a routerLink="/home" class="btn btn-primary">
        <i class="fas fa-house"></i> Volver al inicio
      </a>
    </main>
  `,
  styles: [`
    .main--error { text-align: center; padding: 3em; }
    h2 { font-size: 2rem; color: #d8000c; }
    p  { margin: 1em 0; font-size: 1.1rem; }
  `]
})
export class NotFoundComponent {}
