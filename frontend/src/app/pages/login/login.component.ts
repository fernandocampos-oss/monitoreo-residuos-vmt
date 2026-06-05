import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  isSubmitting = false;

  constructor(private authService: AuthService, private router: Router) {
    // Si ya está logueado, redirigir
    if (this.authService.isLoggedIn()) {
      this.redirectByRole();
    }
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, ingrese su correo y contraseña.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (session) => {
        this.isSubmitting = false;
        this.redirectByRole();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error al iniciar sesión:', err);
        if (err.status === 401) {
          this.errorMessage = 'El correo electrónico o la contraseña son incorrectos.';
        } else {
          this.errorMessage = 'No se pudo conectar con el servidor. Inténtelo más tarde.';
        }
      }
    });
  }

  private redirectByRole() {
    const role = this.authService.userRole();
    if (role === 'operator') {
      this.router.navigate(['/operator']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
