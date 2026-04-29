// src/app/features/admin/login/login.component.ts
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <main class="login-page">
      <div class="login-card">

        <div class="login-header">
          <i class="fas fa-user-shield login-icon"></i>
          <h1>Acceso de Administrador</h1>
          <p>Ingresá con tu email y contraseña</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="login()" class="login-form">

          <div class="form-group">
            <label for="email">Email</label>
            <div class="input-wrap">
              <i class="fas fa-envelope input-icon"></i>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="ejemplo@correo.com"
                autocomplete="email"
              />
            </div>
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <span class="campo-error">El email es obligatorio y debe ser válido</span>
            }
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <div class="input-wrap">
              <i class="fas fa-key input-icon"></i>
              <input
                id="password"
                type="password"
                formControlName="password"
                placeholder="Contraseña"
                autocomplete="current-password"
              />
            </div>
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <span class="campo-error">La contraseña es obligatoria</span>
            }
          </div>

          @if (errorMensaje()) {
            <p class="msg-error">❌ {{ errorMensaje() }}</p>
          }

          <button
            type="submit"
            class="btn btn-primary btn-login"
            [disabled]="cargando() || form.invalid"
          >
            @if (cargando()) {
              <span><i class="fas fa-spinner fa-spin"></i> Ingresando...</span>
            } @else {
              <span><i class="fas fa-right-to-bracket"></i> Ingresar</span>
            }
          </button>

        </form>
      </div>
    </main>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--wc-usa) 0%, #1a237e 100%);
      padding: 1em;
      position: relative;
    }

    .login-page::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: url('https://www.transparenttextures.com/patterns/carbon-fibre.png');
      opacity: 0.05;
    }

    .login-card {
      position: relative;
      background: white;
      border-radius: 20px;
      padding: 3em 2.5em;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 25px 80px rgba(0,0,0,0.3);
    }

    .login-header {
      text-align: center;
      margin-bottom: 2.5em;
    }

    .login-icon {
      font-size: 3rem;
      color: var(--wc-mexico);
      margin-bottom: 0.4em;
    }

    .login-header h1 {
      font-size: 1.5rem;
      font-weight: 800;
      margin: 0.25em 0;
      color: var(--wc-usa);
      font-family: var(--font-display);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .login-header p {
      font-size: 0.9rem;
      color: #666;
      margin: 0;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.5em;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5em;
    }

    .form-group label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--wc-neutral-dark);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .input-wrap {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 1em;
      top: 50%;
      transform: translateY(-50%);
      color: #aaa;
      font-size: 0.9rem;
    }

    .input-wrap input {
      width: 100%;
      padding: 0.85em 1em 0.85em 2.8em;
      border: 1.5px solid #eee;
      border-radius: 12px;
      font-size: 0.95rem;
      transition: all 0.2s;
      box-sizing: border-box;
      background: #fcfcfc;
    }

    .input-wrap input:focus {
      outline: none;
      border-color: var(--wc-mexico);
      background: white;
      box-shadow: 0 0 0 4px rgba(60, 172, 59, 0.15);
    }

    .btn-login {
      width: 100%;
      padding: 1em;
      font-size: 1rem;
      border-radius: 12px;
      margin-top: 1em;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6em;
      font-weight: 700;
      background: var(--wc-usa);
      border: none;
      box-shadow: 0 4px 15px rgba(42, 57, 141, 0.3);
    }

    .btn-login:hover:not(:disabled) {
      background: #1a237e;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(42, 57, 141, 0.4);
    }

    .campo-error {
      color: var(--wc-canada);
      font-size: 0.75rem;
      font-weight: 500;
      margin-top: 0.2em;
    }

  `]
})
export class LoginComponent {

  form: FormGroup;
  cargando = signal(false);
  errorMensaje = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password:  ['',  [Validators.required]]
    });
  }

  login(): void {
    if (this.form.invalid) return;

    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.authService.login(this.form.value).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/admin']);
      },
      error: err => {
        this.cargando.set(false);
        if (err.status === 401) {
          this.errorMensaje.set('Email o contraseña incorrectos.');
        } else {
          this.errorMensaje.set('Error al conectar con el servidor. Intentá más tarde.');
        }
      }
    });
  }
}
