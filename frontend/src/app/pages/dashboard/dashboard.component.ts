import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, Report, Operator } from '../../services/report.service';
import { SectorService, Sector } from '../../services/sector.service';
import { ToastService } from '../../services/toast.service';
import * as L from 'leaflet';

interface MapMarkerData {
  position: { lat: number; lng: number };
  title: string;
  report: Report;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  // Leaflet Map State
  private map!: L.Map;
  private leafletMarkers: L.Marker[] = [];

  // Datos del Dashboard
  reports: Report[] = [];
  filteredReports: Report[] = [];
  sectors: Sector[] = [];
  operators: Operator[] = [];
  markers: MapMarkerData[] = [];
  
  // Filtros
  filterStatus = '';
  filterSector: number | null = null;
  filterLevel = '';
  
  // Reporte Seleccionado y Modal de Edición
  selectedReport: Report | null = null;
  editStatus = '';
  editOperatorId: number | null = null;
  editComment = '';
  
  // Contadores
  totalCount = 0;
  pendingCount = 0;
  inProcessCount = 0;
  atendidoCount = 0;
  
  // UI States
  isLoading = true;
  isUpdatingStatus = false;

  private toastService = inject(ToastService);

  constructor(
    private reportService: ReportService,
    private sectorService: SectorService
  ) {}

  ngOnInit(): void {
    this.loadSectors();
    this.loadOperators();
    this.refreshData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    // Inicializar el mapa centrado en Villa María del Triunfo
    this.map = L.map('map', {
      zoomControl: true,
      attributionControl: true
    }).setView([-12.1612, -76.9365], 13);

    // Cargar capa de mosaicos de OpenStreetMap (totalmente gratis, sin llaves)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  loadSectors(): void {
    this.sectorService.getSectors().subscribe({
      next: (data) => this.sectors = data,
      error: (err) => console.error('Error al cargar sectores:', err)
    });
  }

  loadOperators(): void {
    this.reportService.getOperators().subscribe({
      next: (data) => this.operators = data,
      error: (err) => console.error('Error al cargar operadores:', err)
    });
  }

  refreshData(): void {
    this.isLoading = true;
    this.reportService.getReports().subscribe({
      next: (data) => {
        this.reports = data;
        this.applyFilters();
        this.calculateStats();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar reportes:', err);
      }
    });
  }

  calculateStats(): void {
    this.totalCount = this.reports.length;
    this.pendingCount = this.reports.filter(r => r.status === 'pendiente').length;
    this.inProcessCount = this.reports.filter(r => r.status === 'en_proceso').length;
    this.atendidoCount = this.reports.filter(r => r.status === 'atendido').length;
  }

  applyFilters(): void {
    this.filteredReports = this.reports.filter(report => {
      const matchStatus = !this.filterStatus || report.status === this.filterStatus;
      const matchSector = this.filterSector === null || report.sector_id === this.filterSector;
      const matchLevel = !this.filterLevel || report.accumulation_level === this.filterLevel;
      return matchStatus && matchSector && matchLevel;
    });

    // Actualizar marcadores del mapa
    this.markers = this.filteredReports.map(report => ({
      position: { lat: report.latitude, lng: report.longitude },
      title: `Reporte #${report.id} - ${report.waste_type}`,
      report: report
    }));

    this.renderMarkersOnMap();
  }

  private renderMarkersOnMap(): void {
    if (!this.map) return;

    // Limpiar marcadores anteriores
    this.leafletMarkers.forEach(m => m.remove());
    this.leafletMarkers = [];

    // Helper para generar el icono dinámico de color según estado o criticidad
    const createCustomIcon = (status: string) => {
      let color = '#f59e0b'; // pendiente -> amarillo/naranja
      if (status === 'en_proceso') color = '#38bdf8'; // en_proceso -> azul
      if (status === 'atendido') color = '#10b981'; // atendido -> verde

      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="
          background-color: ${color}; 
          width: 14px; 
          height: 14px; 
          border-radius: 50%; 
          border: 2px solid white; 
          box-shadow: 0 0 8px rgba(0,0,0,0.5);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
    };

    this.markers.forEach((markerData) => {
      const marker = L.marker([markerData.position.lat, markerData.position.lng], {
        icon: createCustomIcon(markerData.report.status),
        title: markerData.title
      }).addTo(this.map);

      marker.on('click', () => {
        this.selectReport(markerData.report);
      });

      this.leafletMarkers.push(marker);
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.filterStatus = '';
    this.filterSector = null;
    this.filterLevel = '';
    this.applyFilters();
  }

  selectReport(report: Report): void {
    // Cargar detalle completo con logs
    this.reportService.getReportById(report.id).subscribe({
      next: (fullReport) => {
        this.selectedReport = fullReport;
        this.editStatus = fullReport.status;
        this.editOperatorId = fullReport.assigned_operator_id || null;
        this.editComment = '';
        
        // Enfocar mapa en el reporte seleccionado
        if (this.map) {
          this.map.setView([fullReport.latitude, fullReport.longitude], 15);
        }
      },
      error: (err) => {
        console.error('Error al cargar detalle del reporte:', err);
        this.toastService.error('No se pudo cargar la información completa del reporte.');
      }
    });
  }

  closeDetail(): void {
    this.selectedReport = null;
  }

  updateReport(): void {
    if (!this.selectedReport) return;

    this.isUpdatingStatus = true;
    const updateData = {
      status: this.editStatus,
      comment: this.editComment.trim() || undefined,
      assigned_operator_id: this.editOperatorId || undefined
    };

    this.reportService.updateReportStatus(this.selectedReport.id, updateData).subscribe({
      next: (updatedReport) => {
        this.isUpdatingStatus = false;
        this.editComment = '';
        
        // Actualizar el reporte seleccionado en el detalle
        this.selectedReport = updatedReport;
        
        // Recargar listado general de reportes
        this.refreshData();
        
        this.toastService.success('Reporte actualizado correctamente.');
      },
      error: (err) => {
        this.isUpdatingStatus = false;
        console.error('Error al actualizar reporte:', err);
        this.toastService.error('Hubo un error al guardar los cambios del reporte.');
      }
    });
  }
}
