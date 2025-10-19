import { Injectable } from '@nestjs/common';

export interface ReportData {
  month: string;
  appointments: number;
  revenue: number;
  clients: number;
  avgDuration: number;
}

export interface ServiceStats {
  name: string;
  count: number;
  percentage: number;
  revenue: number;
}

export interface MonthlyReport {
  data: ReportData[];
  serviceStats: ServiceStats[];
  summary: {
    totalAppointments: number;
    totalRevenue: number;
    totalClients: number;
    avgDuration: number;
    appointmentGrowth: number;
    revenueGrowth: number;
    clientGrowth: number;
  };
}

export interface ReportFilters {
  period: '6-months' | '12-months' | 'current-year';
  year?: number;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ReportsService {
  
  // Datos mock para demostración - en producción estos vendrían de la base de datos
  private mockReportData: ReportData[] = [
    { month: "Enero", appointments: 145, revenue: 2850000, clients: 89, avgDuration: 75 },
    { month: "Febrero", appointments: 132, revenue: 2640000, clients: 82, avgDuration: 78 },
    { month: "Marzo", appointments: 168, revenue: 3360000, clients: 95, avgDuration: 72 },
    { month: "Abril", appointments: 156, revenue: 3120000, clients: 91, avgDuration: 80 },
    { month: "Mayo", appointments: 189, revenue: 3780000, clients: 108, avgDuration: 68 },
    { month: "Junio", appointments: 201, revenue: 4020000, clients: 115, avgDuration: 70 }
  ];

  private mockServiceStats: ServiceStats[] = [
    { name: "Corte y peinado", count: 245, percentage: 35, revenue: 4900000 },
    { name: "Manicure", count: 189, percentage: 27, revenue: 2835000 },
    { name: "Tinte y mechas", count: 134, percentage: 19, revenue: 4020000 },
    { name: "Maquillaje", count: 98, percentage: 14, revenue: 2940000 },
    { name: "Otros", count: 35, percentage: 5, revenue: 875000 }
  ];

  async getMonthlyReports(filters: ReportFilters): Promise<MonthlyReport> {
    // En producción, aquí harías consultas a la base de datos basadas en los filtros
    const data = this.filterDataByPeriod(this.mockReportData, filters);
    const serviceStats = this.mockServiceStats;

    const summary = this.calculateSummary(data);

    return {
      data,
      serviceStats,
      summary
    };
  }

  async getAppointmentReports(filters: ReportFilters): Promise<ReportData[]> {
    return this.filterDataByPeriod(this.mockReportData, filters);
  }

  async getServiceReports(filters: ReportFilters): Promise<ServiceStats[]> {
    return this.mockServiceStats;
  }

  async generatePDFReport(filters: ReportFilters): Promise<Buffer> {
    // Aquí implementarías la generación de PDF usando una librería como puppeteer o jsPDF
    // Por ahora retornamos un buffer mock
    const mockPDF = Buffer.from('Mock PDF Report Content', 'utf-8');
    return mockPDF;
  }

  async generateExcelReport(filters: ReportFilters): Promise<Buffer> {
    // Aquí implementarías la generación de Excel usando una librería como exceljs
    // Por ahora retornamos un buffer mock
    const mockExcel = Buffer.from('Mock Excel Report Content', 'utf-8');
    return mockExcel;
  }

  private filterDataByPeriod(data: ReportData[], filters: ReportFilters): ReportData[] {
    // Implementar lógica de filtrado basada en el período
    switch (filters.period) {
      case '6-months':
        return data.slice(-6);
      case '12-months':
        return data.slice(-12);
      case 'current-year':
        return data; // En producción filtrarías por año actual
      default:
        return data;
    }
  }

  private calculateSummary(data: ReportData[]) {
    const totalAppointments = data.reduce((sum, d) => sum + d.appointments, 0);
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalClients = data.reduce((sum, d) => sum + d.clients, 0);
    const avgDuration = data.length > 0 
      ? Math.round(data.reduce((sum, d) => sum + d.avgDuration, 0) / data.length)
      : 0;

    // Calcular crecimiento (comparando último mes con penúltimo)
    const currentMonth = data[data.length - 1];
    const previousMonth = data[data.length - 2];

    const appointmentGrowth = previousMonth 
      ? ((currentMonth.appointments - previousMonth.appointments) / previousMonth.appointments * 100)
      : 0;
    
    const revenueGrowth = previousMonth 
      ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100)
      : 0;
    
    const clientGrowth = previousMonth 
      ? ((currentMonth.clients - previousMonth.clients) / previousMonth.clients * 100)
      : 0;

    return {
      totalAppointments,
      totalRevenue,
      totalClients,
      avgDuration,
      appointmentGrowth,
      revenueGrowth,
      clientGrowth
    };
  }
}
