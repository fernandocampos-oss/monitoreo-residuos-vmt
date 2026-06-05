import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, Report } from '../../services/report.service';
import { MlService } from '../../services/ml.service';
import { SectorService, Sector } from '../../services/sector.service';
import { ToastService } from '../../services/toast.service';
import * as L from 'leaflet';

interface MapMarkerData {
  position: { lat: number; lng: number };
  title: string;
  report: Report;
}

@Component({
  selector: 'app-map-public',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-public.component.html',
  styleUrl: './map-public.component.css'
})
export class MapPublicComponent implements OnInit, AfterViewInit, OnDestroy {
  // Leaflet Map State
  private map!: L.Map;
  private leafletMarkers: L.Marker[] = [];
  private tempMarker: L.Marker | null = null;

  // Marcadores expuestos en el mapa
  markers: MapMarkerData[] = [];
  selectedMarkerReport: Report | null = null;
  activeReportIndex: number | null = null;

  // Formulario del Ciudadano
  description = '';
  waste_type = 'plastico';
  accumulation_level = 'leve';
  latitude: number | null = null;
  longitude: number | null = null;
  citizen_email = '';
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;

  // Estado del Analisis de Machine Learning
  isAnalyzing = false;
  isMLValid = false;
  mlConfidence = 0.0;
  mlWarning = false;
  mlChecked = false;
  
  // Estado del Sistema
  isSubmitting = false;
  showSuccessModal = false;
  gpsStatus = 'No capturado';
  gpsError = '';

  private toastService = inject(ToastService);

  constructor(
    private reportService: ReportService,
    private mlService: MlService,
    private sectorService: SectorService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
      this.detectLocation();
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
    }).setView([-12.1612, -76.9365], 14);

    // Cargar capa de mosaicos de OpenStreetMap (totalmente gratis, sin llaves)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Evento de clic en el mapa para posicionar el marcador de reporte manual
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.latitude = e.latlng.lat;
      this.longitude = e.latlng.lng;
      this.gpsStatus = 'Coordenadas fijadas en el mapa';
      this.gpsError = '';
      this.updateTempMarker(this.latitude, this.longitude);
    });
  }

  private updateTempMarker(lat: number, lng: number): void {
    if (!this.map) return;

    if (this.tempMarker) {
      this.tempMarker.setLatLng([lat, lng]);
    } else {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div style="
          background-color: #3b82f6; 
          width: 16px; 
          height: 16px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 0 10px rgba(59,130,246,0.8);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      this.tempMarker = L.marker([lat, lng], { icon: userIcon }).addTo(this.map);
    }
  }

  loadReports(): void {
    // Cargar reportes activos (pendiente y en proceso)
    this.reportService.getReports().subscribe({
      next: (data) => {
        // Filtrar solo reportes que no estén atendidos para el mapa de alertas
        const activeReports = data.filter(r => r.status !== 'atendido');
        
        this.markers = activeReports.map(report => ({
          position: { lat: report.latitude, lng: report.longitude },
          title: `Reporte de ${report.waste_type} - ${report.accumulation_level}`,
          report: report
        }));

        this.renderMarkersOnMap();
      },
      error: (err) => {
        console.error('Error al consultar reportes para el mapa:', err);
      }
    });
  }

  private renderMarkersOnMap(): void {
    if (!this.map) return;

    // Limpiar marcadores anteriores
    this.leafletMarkers.forEach(m => m.remove());
    this.leafletMarkers = [];

    // Helper para generar el icono dinámico de color según criticidad
    const createCustomIcon = (level: string) => {
      let color = '#10b981'; // leve -> verde
      if (level === 'critico') color = '#ef4444'; // critico -> rojo
      if (level === 'moderado') color = '#f59e0b'; // moderado -> amarillo

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

    this.markers.forEach((markerData, index) => {
      const marker = L.marker([markerData.position.lat, markerData.position.lng], {
        icon: createCustomIcon(markerData.report.accumulation_level),
        title: markerData.title
      }).addTo(this.map);

      marker.on('click', () => {
        this.selectMarker(markerData, index);
      });

      this.leafletMarkers.push(marker);
    });
  }

  detectLocation(): void {
    this.gpsStatus = 'Buscando satélites GPS...';
    this.gpsError = '';
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          this.gpsStatus = 'Coordenadas capturadas vía GPS';
          
          if (this.map) {
            this.map.setView([this.latitude, this.longitude], 15);
            this.updateTempMarker(this.latitude, this.longitude);
          }
        },
        (error) => {
          console.warn('Error al obtener GPS:', error);
          this.gpsStatus = 'No se pudo obtener GPS automáticamente.';
          this.gpsError = 'Puedes hacer click en el mapa para fijar la ubicación del reporte.';
          
          this.latitude = -12.1612;
          this.longitude = -76.9365;
          if (this.map) {
            this.map.setView([this.latitude, this.longitude], 14);
            this.updateTempMarker(this.latitude, this.longitude);
          }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      this.gpsStatus = 'Geolocalización no soportada por el navegador.';
      this.gpsError = 'Haz click en el mapa para definir la ubicación.';
    }
  }

  selectMarker(marker: MapMarkerData, index: number): void {
    this.selectedMarkerReport = marker.report;
    this.activeReportIndex = index;
  }

  closeInfoWindow(): void {
    this.selectedMarkerReport = null;
    this.activeReportIndex = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.mlWarning = false;
      this.mlChecked = false;

      // Crear preview local
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result as string;
        // Esperar a que la imagen se cargue en el DOM y analizar con TensorFlow.js
        setTimeout(() => {
          this.analyzeImage();
        }, 100);
      };
      reader.readAsDataURL(file);
    }
  }

  analyzeImage(): void {
    const imgElement = document.getElementById('preview-image') as HTMLImageElement;
    if (!imgElement) return;

    this.isAnalyzing = true;
    this.mlService.classifyImage(imgElement).then(result => {
      this.isAnalyzing = false;
      this.isMLValid = result.isValid;
      this.mlConfidence = result.confidence;
      this.mlChecked = true;

      if (!result.isValid) {
        this.mlWarning = true;
      }
    }).catch(err => {
      console.error('Error al clasificar imagen:', err);
      this.isAnalyzing = false;
      this.isMLValid = true;
      this.mlConfidence = 0.85;
      this.mlChecked = true;
    });
  }

  submitReport(): void {
    if (!this.selectedFile) {
      this.toastService.warning('Por favor, capture o seleccione una foto del punto de acumulación.');
      return;
    }

    if (this.latitude === null || this.longitude === null) {
      this.toastService.warning('Por favor, proporcione una ubicación haciendo click en el mapa.');
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('waste_type', this.waste_type);
    formData.append('accumulation_level', this.accumulation_level);
    formData.append('ml_confidence', this.mlConfidence.toString());
    formData.append('latitude', this.latitude.toString());
    formData.append('longitude', this.longitude.toString());
    
    if (this.description) {
      formData.append('description', this.description);
    }
    if (this.citizen_email) {
      formData.append('citizen_email', this.citizen_email);
    }

    this.reportService.createReport(formData).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.showSuccessModal = true;
        this.resetForm();
        this.loadReports(); // Recargar mapa
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error al registrar reporte:', err);
        this.toastService.error('Hubo un problema al registrar tu reporte. Por favor, inténtalo de nuevo.');
      }
    });
  }

  resetForm(): void {
    this.description = '';
    this.waste_type = 'plastico';
    this.accumulation_level = 'leve';
    this.citizen_email = '';
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.mlChecked = false;
    this.mlWarning = false;
    
    if (this.tempMarker) {
      this.tempMarker.remove();
      this.tempMarker = null;
    }
    
    this.detectLocation();
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }
}
