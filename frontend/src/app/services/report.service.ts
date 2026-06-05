import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from './api-config';
import { AuthService } from './auth.service';

export interface ReportLog {
  id: number;
  report_id: number;
  user_id?: number;
  previous_status?: string;
  new_status: string;
  comment?: string;
  created_at: string;
  user_name?: string;
}

export interface Report {
  id: number;
  image_url: string;
  description?: string;
  waste_type: string;
  ml_confidence: number;
  accumulation_level: string;
  latitude: number;
  longitude: number;
  status: string;
  sector_id?: number;
  citizen_email?: string;
  assigned_operator_id?: number;
  created_at: string;
  updated_at: string;
  
  // Datos enriquecidos por el backend
  sector_name?: string;
  assigned_operator_name?: string;
  logs?: ReportLog[];
}

export interface SectorStats {
  sector_name: string;
  total_reports: number;
  pending_reports: number;
  in_process_reports: number;
  atendido_reports: number;
  leve_reports: number;
  moderado_reports: number;
  critico_reports: number;
}

export interface GeneralStats {
  total_reports: number;
  pending_reports: number;
  in_process_reports: number;
  atendido_reports: number;
  by_waste_type: { [key: string]: number };
  by_sector: SectorStats[];
}

export interface Operator {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  zone_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  private formatReportImage(report: Report): Report {
    if (report && report.image_url && report.image_url.startsWith('/static/')) {
      report.image_url = `${API_BASE_URL}${report.image_url}`;
    }
    return report;
  }

  getReports(filters?: {
    status?: string;
    sector_id?: number;
    accumulation_level?: string;
    operator_id?: number;
  }): Observable<Report[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.sector_id) params = params.set('sector_id', filters.sector_id.toString());
      if (filters.accumulation_level) params = params.set('accumulation_level', filters.accumulation_level);
      if (filters.operator_id) params = params.set('operator_id', filters.operator_id.toString());
    }

    return this.http.get<Report[]>(`${API_BASE_URL}/api/reports`, { params }).pipe(
      map(reports => reports.map(r => this.formatReportImage(r)))
    );
  }

  getReportById(id: number): Observable<Report> {
    return this.http.get<Report>(`${API_BASE_URL}/api/reports/${id}`).pipe(
      map(report => this.formatReportImage(report))
    );
  }

  createReport(formData: FormData): Observable<Report> {
    // Formulario ciudadano (anónimo), no requiere cabeceras de autorización
    return this.http.post<Report>(`${API_BASE_URL}/api/reports`, formData).pipe(
      map(report => this.formatReportImage(report))
    );
  }

  updateReportStatus(
    id: number, 
    updateData: { status: string; comment?: string; assigned_operator_id?: number }
  ): Observable<Report> {
    const headers = this.authService.getAuthHeaders();
    return this.http.patch<Report>(`${API_BASE_URL}/api/reports/${id}/status`, updateData, { headers }).pipe(
      map(report => this.formatReportImage(report))
    );
  }

  getStatsSummary(): Observable<GeneralStats> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<GeneralStats>(`${API_BASE_URL}/api/reports/stats/summary`, { headers });
  }

  getOperators(): Observable<Operator[]> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<Operator[]>(`${API_BASE_URL}/api/users/operators`, { headers });
  }
}
