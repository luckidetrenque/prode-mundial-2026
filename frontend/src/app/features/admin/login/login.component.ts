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
          <i class="fas fa-lock login-icon"></i>
          <h1>Acceso de Administrador</h1>
          <p>Ingresá con tu número de afiliado y contraseña</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="login()" class="login-form">

          <div class="form-group">
            <label for="afiliado">N° de Afiliado</label>
            <div class="input-wrap">
              <i class="fas fa-id-card input-icon"></i>
              <input
                id="afiliado"
                type="number"
                formControlName="afiliado"
                placeholder="Número de afiliado"
                min="1"
                autocomplete="username"
              />
            </div>
            @if (form.get('afiliado')?.invalid && form.get('afiliado')?.touched) {
              <span class="campo-error">El número de afiliado es obligatorio</span>
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
      background: linear-gradient(135deg, var(--clr-primary-dark) 0%, var(--clr-primary) 100%);
      padding: 1em;
    }

    .login-card {
      background: white;
      border-radius: 16px;
      padding: 2.5em 2em;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    }

    .login-header {
      text-align: center;
      margin-bottom: 2em;
    }

    .login-icon {
      font-size: 2.5rem;
      color: var(--clr-primary);
      margin-bottom: 0.5em;
    }

    .login-header h1 {
      font-size: 1.4rem;
      font-weight: 700;
      margin: 0.25em 0;
      color: var(--clr-primary-dark);
    }

    .login-header p {
      font-size: 0.85rem;
      color: #666;
      margin: 0;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25em;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4em;
    }

    .form-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #444;
    }

    .input-wrap {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 0.9em;
      top: 50%;
      transform: translateY(-50%);
      color: #aaa;
      font-size: 0.9rem;
    }

    .input-wrap input {
      width: 100%;
      padding: 0.75em 0.75em 0.75em 2.5em;
      border: 1.5px solid #ddd;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .input-wrap input:focus {
      outline: none;
      border-color: var(--clr-primary);
      box-shadow: 0 0 0 3px rgba(86, 4, 44, 0.1);
    }

    .btn-login {
      width: 100%;
      padding: 0.85em;
      font-size: 1rem;
      border-radius: 8px;
      margin-top: 0.5em;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5em;
    }

    .campo-error {
      color: var(--clr-error-text);
      font-size: 0.75rem;
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
      afiliado: [null, [Validators.required, Validators.min(1)]],
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
          this.errorMensaje.set('Número de afiliado o contraseña incorrectos.');
        } else {
          this.errorMensaje.set('Error al conectar con el servidor. Intentá más tarde.');
        }
      }
    });
  }
}
