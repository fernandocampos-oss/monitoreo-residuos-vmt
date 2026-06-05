import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../services/api-config';
import { AuthService } from '../../services/auth.service';
import { SectorService, Sector } from '../../services/sector.service';
import { ToastService } from '../../services/toast.service';

interface UserAccount {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  zone_id?: number;
  created_at: string;
  zone?: Sector;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  users: UserAccount[] = [];
  sectors: Sector[] = [];
  isLoading = true;

  // Formulario de Usuario
  showFormModal = false;
  isEditMode = false;
  selectedUserId: number | null = null;

  email = '';
  password = '';
  first_name = '';
  last_name = '';
  role = 'operator';
  zone_id: number | null = null;
  
  isSubmitting = false;

  private toastService = inject(ToastService);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private sectorService: SectorService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadSectors();
  }

  loadUsers(): void {
    this.isLoading = true;
    const headers = this.authService.getAuthHeaders();
    this.http.get<UserAccount[]>(`${API_BASE_URL}/api/users`, { headers }).subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar usuarios:', err);
      }
    });
  }

  loadSectors(): void {
    this.sectorService.getSectors().subscribe({
      next: (data) => this.sectors = data,
      error: (err) => console.error('Error al cargar sectores:', err)
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedUserId = null;
    this.resetForm();
    this.showFormModal = true;
  }

  openEditModal(user: UserAccount): void {
    this.isEditMode = true;
    this.selectedUserId = user.id;
    this.email = user.email;
    this.password = ''; // Opcional en edición
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.role = user.role;
    this.zone_id = user.zone_id || null;
    this.showFormModal = true;
  }

  closeModal(): void {
    this.showFormModal = false;
  }

  onSubmit(): void {
    if (!this.email || !this.first_name || !this.last_name || !this.role) {
      this.toastService.warning('Por favor, complete todos los campos obligatorios.');
      return;
    }

    if (!this.isEditMode && !this.password) {
      this.toastService.warning('Por favor, defina una contraseña para la nueva cuenta.');
      return;
    }

    this.isSubmitting = true;
    const headers = this.authService.getAuthHeaders();

    const payload: any = {
      email: this.email,
      first_name: this.first_name,
      last_name: this.last_name,
      role: this.role,
      zone_id: this.role === 'operator' ? this.zone_id : null
    };

    if (this.password) {
      payload.password = this.password;
    }

    if (this.isEditMode && this.selectedUserId) {
      // Editar
      this.http.patch<UserAccount>(`${API_BASE_URL}/api/users/${this.selectedUserId}`, payload, { headers }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showFormModal = false;
          this.loadUsers();
          this.toastService.success('Cuenta de usuario actualizada correctamente.');
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error al editar usuario:', err);
          this.toastService.error('No se pudo guardar la información del usuario.');
        }
      });
    } else {
      // Crear
      this.http.post<UserAccount>(`${API_BASE_URL}/api/users`, payload, { headers }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showFormModal = false;
          this.loadUsers();
          this.toastService.success('Cuenta de usuario creada exitosamente.');
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error al crear usuario:', err);
          this.toastService.error('No se pudo crear la cuenta de usuario. Verifique si el correo ya está registrado.');
        }
      });
    }
  }

  deleteUser(user: UserAccount): void {
    if (confirm(`¿Está seguro de que desea eliminar la cuenta de ${user.first_name} ${user.last_name}?`)) {
      const headers = this.authService.getAuthHeaders();
      this.http.delete(`${API_BASE_URL}/api/users/${user.id}`, { headers }).subscribe({
        next: () => {
          this.loadUsers();
          this.toastService.success('Cuenta eliminada con éxito.');
        },
        error: (err) => {
          console.error('Error al eliminar usuario:', err);
          this.toastService.error('No se pudo eliminar la cuenta de usuario.');
        }
      });
    }
  }

  resetForm(): void {
    this.email = '';
    this.password = '';
    this.first_name = '';
    this.last_name = '';
    this.role = 'operator';
    this.zone_id = null;
  }
}
