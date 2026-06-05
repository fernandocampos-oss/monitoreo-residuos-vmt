import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from './api-config';

export interface UserSession {
  access_token: string;
  token_type: string;
  user_id: number;
  role: string;
  email: string;
  first_name: string;
  last_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Signal para almacenar la sesion actual del usuario
  private sessionSignal = signal<UserSession | null>(null);

  // Signals computados expuestos públicamente
  public currentUser = computed(() => this.sessionSignal());
  public isLoggedIn = computed(() => this.sessionSignal() !== null);
  public userRole = computed(() => this.sessionSignal()?.role || null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadSessionFromStorage();
  }

  private loadSessionFromStorage(): void {
    const savedSession = localStorage.getItem('vmt_waste_session');
    if (savedSession) {
      try {
        this.sessionSignal.set(JSON.parse(savedSession));
      } catch (e) {
        localStorage.removeItem('vmt_waste_session');
      }
    }
  }

  login(credentials: { email: string; password: string }): Observable<UserSession> {
    return this.http.post<UserSession>(`${API_BASE_URL}/api/auth/login`, credentials).pipe(
      tap((session) => {
        localStorage.setItem('vmt_waste_session', JSON.stringify(session));
        this.sessionSignal.set(session);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('vmt_waste_session');
    this.sessionSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.sessionSignal()?.access_token || null;
  }

  hasRole(allowedRoles: string[]): boolean {
    const role = this.userRole();
    if (!role) return false;
    return allowedRoles.includes(role);
  }

  // Generar cabecera de autenticacion JWT Bearer
  getAuthHeaders(): { [header: string]: string } {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}
