import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, Report } from '../../services/report.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-operator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './operator.component.html',
  styleUrl: './operator.component.css'
})
export class OperatorComponent implements OnInit {
  assignedReports: Report[] = [];
  selectedReport: Report | null = null;
  
  // Formulario de atencion
  actionComment = '';
  isSubmittingAction = false;
  isLoading = true;

  currentUser = computed(() => this.authService.currentUser());

  private toastService = inject(ToastService);

  constructor(
    private reportService: ReportService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAssignedTasks();
  }

  loadAssignedTasks(): void {
    const user = this.currentUser();
    if (!user) return;

    this.isLoading = true;
    this.reportService.getReports({ operator_id: user.user_id }).subscribe({
      next: (data) => {
        this.assignedReports = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar tareas del operador:', err);
      }
    });
  }

  selectReport(report: Report): void {
    this.isLoading = true;
    this.reportService.getReportById(report.id).subscribe({
      next: (fullReport) => {
        this.selectedReport = fullReport;
        this.actionComment = '';
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar detalle de tarea:', err);
      }
    });
  }

  closeDetail(): void {
    this.selectedReport = null;
  }

  resolveReport(): void {
    if (!this.selectedReport) return;

    if (!this.actionComment.trim()) {
      this.toastService.warning('Por favor, describa las acciones de limpieza realizadas.');
      return;
    }

    this.isSubmittingAction = true;
    
    const updateData = {
      status: 'atendido',
      comment: this.actionComment.trim()
    };

    this.reportService.updateReportStatus(this.selectedReport.id, updateData).subscribe({
      next: (updated) => {
        this.isSubmittingAction = false;
        this.selectedReport = null;
        this.loadAssignedTasks(); // Recargar listado
        this.toastService.success('Tarea marcada como atendida exitosamente.');
      },
      error: (err) => {
        this.isSubmittingAction = false;
        console.error('Error al resolver reporte:', err);
        this.toastService.error('Ocurrió un error al guardar la acción.');
      }
    });
  }

  registerProgress(): void {
    if (!this.selectedReport) return;

    if (!this.actionComment.trim()) {
      this.toastService.warning('Por favor, ingrese un comentario sobre el avance.');
      return;
    }

    this.isSubmittingAction = true;
    
    const updateData = {
      status: 'en_proceso',
      comment: this.actionComment.trim()
    };

    this.reportService.updateReportStatus(this.selectedReport.id, updateData).subscribe({
      next: (updated) => {
        this.isSubmittingAction = false;
        this.selectedReport = updated; // Refrescar modal
        this.loadAssignedTasks(); // Recargar listado
        this.actionComment = '';
        this.toastService.success('Avance registrado en la bitácora.');
      },
      error: (err) => {
        this.isSubmittingAction = false;
        console.error('Error al registrar avance:', err);
        this.toastService.error('Ocurrió un error al registrar el avance.');
      }
    });
  }
}
