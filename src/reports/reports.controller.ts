import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';

export interface ReportFilters {
  period: '6-months' | '12-months' | 'current-year';
  year?: number;
  startDate?: string;
  endDate?: string;
}

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  async getMonthlyReports(@Query() filters: ReportFilters) {
    return this.reportsService.getMonthlyReports(filters);
  }

  @Get('appointments')
  async getAppointmentReports(@Query() filters: ReportFilters) {
    return this.reportsService.getAppointmentReports(filters);
  }

  @Get('services')
  async getServiceReports(@Query() filters: ReportFilters) {
    return this.reportsService.getServiceReports(filters);
  }

  @Get('export/pdf')
  async exportReportPDF(@Query() filters: ReportFilters, @Res() res: Response) {
    const pdfBuffer = await this.reportsService.generatePDFReport(filters);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-salon-${filters.period}-${filters.year || new Date().getFullYear()}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.send(pdfBuffer);
  }

  @Get('export/excel')
  async exportReportExcel(@Query() filters: ReportFilters, @Res() res: Response) {
    const excelBuffer = await this.reportsService.generateExcelReport(filters);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="reporte-salon-${filters.period}-${filters.year || new Date().getFullYear()}.xlsx"`,
      'Content-Length': excelBuffer.length,
    });
    
    res.send(excelBuffer);
  }
}
