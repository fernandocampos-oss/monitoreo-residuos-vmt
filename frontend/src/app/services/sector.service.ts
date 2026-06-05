import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import { AuthService } from './auth.service';

export interface Sector {
  id: number;
  name: string;
  coordinates_json: string;
}

@Injectable({
  providedIn: 'root'
})
export class SectorService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  getSectors(): Observable<Sector[]> {
    return this.http.get<Sector[]>(`${API_BASE_URL}/api/sectors`);
  }

  getSectorById(id: number): Observable<Sector> {
    return this.http.get<Sector>(`${API_BASE_URL}/api/sectors/${id}`);
  }

  createSector(sector: { name: string; coordinates_json: string }): Observable<Sector> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<Sector>(`${API_BASE_URL}/api/sectors`, sector, { headers });
  }
}
