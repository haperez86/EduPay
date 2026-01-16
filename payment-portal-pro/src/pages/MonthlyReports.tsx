import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/BranchContext';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Building, 
  BarChart3,
  Download,
  Filter
} from 'lucide-react';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import * as XLSX from 'xlsx';

interface MonthlyIncome {
  id: string;
  month: string;
  year: number;
  monthNumber: number;
  totalIncome: number;
  paymentCount: number;
  branchId?: number;
  branchName?: string;
  // Nuevos campos para el reporte mejorado
  totalSales: number;        // Ventas totales
  totalPaid: number;         // Abonos totales
  totalPending: number;      // Pendientes totales
}

interface YearSummary {
  totalIncome: number;
  totalPayments: number;
  averageMonthly: number;
  bestMonth: { month: string; income: number };
  worstMonth: { month: string; income: number };
}

const MonthlyReports: React.FC = () => {
  const { get } = useApi();
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();
  const { branches } = useBranch();
  
  const [monthlyData, setMonthlyData] = useState<MonthlyIncome[]>([]);
  const [filteredData, setFilteredData] = useState<MonthlyIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtros
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  
  // Estadísticas
  const [summary, setSummary] = useState<YearSummary | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('year', selectedYear.toString());
      
      if (isSuperAdmin() && selectedBranch !== 'all') {
        params.append('branchId', selectedBranch);
      }
      
      const data = await get<MonthlyIncome[]>(`/payments/monthly-income?${params}`);
      // Add unique id to each item for DataTable compatibility
      const dataWithIds = data.map((item, index) => ({
        ...item,
        id: `${item.year}-${item.monthNumber}-${item.branchId || 'all'}`
      }));
      setMonthlyData(dataWithIds);
      
      // Calcular estadísticas
      if (dataWithIds.length > 0) {
        const totalIncome = dataWithIds.reduce((sum, item) => sum + item.totalIncome, 0);
        const totalPayments = dataWithIds.reduce((sum, item) => sum + item.paymentCount, 0);
        const averageMonthly = totalIncome / dataWithIds.length;
        
        const sortedByIncome = [...dataWithIds].sort((a, b) => b.totalIncome - a.totalIncome);
        const bestMonth = {
          month: `${sortedByIncome[0].month} ${sortedByIncome[0].year}`,
          income: sortedByIncome[0].totalIncome
        };
        const worstMonth = {
          month: `${sortedByIncome[sortedByIncome.length - 1].month} ${sortedByIncome[sortedByIncome.length - 1].year}`,
          income: sortedByIncome[sortedByIncome.length - 1].totalIncome
        };
        
        setSummary({
          totalIncome,
          totalPayments,
          averageMonthly,
          bestMonth,
          worstMonth
        });
      } else {
        setSummary(null);
      }
    } catch (error) {
      console.error('Error fetching monthly income data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del reporte mensual',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [get, selectedYear, selectedBranch, isSuperAdmin, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...monthlyData];
    
    if (!isSuperAdmin() && selectedBranch === 'all') {
      // Para usuarios no admin, mostrar solo sus datos
      filtered = monthlyData;
    }
    
    setFilteredData(filtered);
  }, [monthlyData, selectedBranch, isSuperAdmin]);

  // Generar años disponibles (últimos 5 años + actual)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Función de exportación a Excel
  const exportToExcel = useCallback(() => {
    try {
      if (filteredData.length === 0) {
        toast({
          title: 'Sin datos',
          description: 'No hay datos para exportar en el período seleccionado',
          variant: 'destructive',
        });
        return;
      }

      // Preparar datos para Excel
      const excelData = filteredData.map(item => ({
        'Mes': item.month,
        'Año': item.year,
        'Sede': item.branchName || 'Todas',
        'Ventas Totales': item.totalSales,
        'Abonos': item.totalPaid,
        'Pendientes': item.totalPending
      }));

      // Crear worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Crear workbook y añadir el worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte Mensual');

      // Ajustar anchos de columna
      const colWidths = [
        { wch: 12 }, // Mes
        { wch: 8 },  // Año
        { wch: 20 }, // Sede
        { wch: 18 }, // Ventas Totales
        { wch: 15 }, // Abonos
        { wch: 15 }  // Pendientes
      ];
      ws['!cols'] = colWidths;

      // Formatear números como moneda
      const range = XLSX.utils.decode_range(ws['!ref']!);
      for (let R = range.s.r + 1; R <= range.e.r; ++R) { // Empezar desde la fila 1 (saltando encabezados)
        // Columna D (Ventas Totales) - formato moneda
        const cellSales = ws[XLSX.utils.encode_cell({ r: R, c: 3 })];
        if (cellSales && typeof cellSales.v === 'number') {
          cellSales.z = '$#,##0.00';
          cellSales.t = 'n';
        }
        
        // Columna E (Abonos) - formato moneda
        const cellPaid = ws[XLSX.utils.encode_cell({ r: R, c: 4 })];
        if (cellPaid && typeof cellPaid.v === 'number') {
          cellPaid.z = '$#,##0.00';
          cellPaid.t = 'n';
        }
        
        // Columna F (Pendientes) - formato moneda
        const cellPending = ws[XLSX.utils.encode_cell({ r: R, c: 5 })];
        if (cellPending && typeof cellPending.v === 'number') {
          cellPending.z = '$#,##0.00';
          cellPending.t = 'n';
        }
      }

      // Generar nombre de archivo
      const branchName = selectedBranch === 'all' ? 'Todas' : 
        branches.find(b => b.id.toString() === selectedBranch)?.name || 'Sede';
      const fileName = `Reporte_Ventas_Mensuales_${selectedYear}_${branchName.replace(/\s+/g, '_')}.xlsx`;

      // Exportar y descargar
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: 'Exportación exitosa',
        description: `Se han exportado ${filteredData.length} registros a Excel`,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: 'Error de exportación',
        description: 'No se pudo exportar los datos. Intente nuevamente.',
        variant: 'destructive',
      });
    }
  }, [filteredData, selectedYear, selectedBranch, branches, toast]);

  // Columnas para la tabla
  const columns = [
    {
      key: 'month',
      header: 'Mes',
      render: (item: MonthlyIncome) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{item.month}</span>
        </div>
      ),
    },
    {
      key: 'year',
      header: 'Año',
      render: (item: MonthlyIncome) => (
        <span className="text-muted-foreground">{item.year}</span>
      ),
    },
    ...(isSuperAdmin() ? [{
      key: 'branchName',
      header: 'Sede',
      render: (item: MonthlyIncome) => {
        if (!item.branchName) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-muted-foreground" />
            <span>{item.branchName}</span>
          </div>
        );
      },
    }] : []),
    {
      key: 'totalSales',
      header: 'Ventas Totales',
      render: (item: MonthlyIncome) => (
        <span className="font-bold text-blue-600">
          {formatCurrency(item.totalSales)}
        </span>
      ),
    },
    {
      key: 'totalPaid',
      header: 'Abonos',
      render: (item: MonthlyIncome) => (
        <span className="font-bold text-green-600">
          {formatCurrency(item.totalPaid)}
        </span>
      ),
    },
    {
      key: 'totalPending',
      header: 'Pendientes',
      render: (item: MonthlyIncome) => (
        <span className="font-bold text-orange-600">
          {formatCurrency(item.totalPending)}
        </span>
      ),
    },
  ] as any;

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar title="Reportes Mensuales" />
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar title="Reportes Mensuales" />

      <div className="p-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Reportes de Ingresos Mensuales
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Análisis consolidado de ingresos mes a mes
            </p>
          </div>
          <Button 
            className="btn-primary gap-2 w-full sm:w-auto"
            onClick={exportToExcel}
            disabled={filteredData.length === 0}
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5" />
              Filtros del Reporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Selector de año */}
              <div>
                <label className="text-sm font-medium mb-2 block">Año</label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selector de sede (solo para SUPER_ADMIN) */}
              {isSuperAdmin() && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Sede</label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las sedes</SelectItem>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tarjetas de resumen */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total del Año</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(summary.totalIncome)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Promedio Mensual</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(summary.averageMonthly)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mejor Mes</p>
                    <p className="text-lg font-bold text-emerald-600 truncate">
                      {summary.bestMonth.month}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(summary.bestMonth.income)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pagos</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {summary.totalPayments.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabla de resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5" />
              Detalle Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length > 0 ? (
              <DataTable
                columns={columns}
                data={filteredData}
                emptyMessage="No hay datos disponibles para el período seleccionado"
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay datos disponibles para el período seleccionado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MonthlyReports;
