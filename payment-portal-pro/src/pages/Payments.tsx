import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useApi } from '@/hooks/useApi';
import { Payment, Enrollment, Student, Course, CreatePaymentDTO } from '@/types/models';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/BranchContext';
import { Plus, Trash2, Calendar, CreditCard, Banknote, Building, Search, Filter, X, DollarSign } from 'lucide-react';
import { ButtonLoader, PageLoader } from '@/components/ui/LoadingSpinner';
import { Progress } from '@/components/ui/progress';

interface PaymentMethod {
  id: number;
  name: string;
}

const ITEMS_PER_PAGE = 10;

const Payments: React.FC = () => {
  const { get, post, del } = useApi();
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();
  const branchContext = useBranch();
  const { branches } = branchContext;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  
  // Ordenamiento
  const [sortField, setSortField] = useState<'paymentDate' | 'amount'>('paymentDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState<CreatePaymentDTO>({
    enrollmentId: 0,
    amount: 0,
    paymentMethodId: 0,
    type: 'ABONO',
  });

  const fetchData = useCallback(async () => {
    try {
      const [paymentsData, enrollmentsData, studentsData, coursesData, methodsData] = await Promise.all([
        get<Payment[]>('/payments'),
        get<Enrollment[]>('/enrollments'),
        get<Student[]>('/students'),
        get<Course[]>('/courses'),
        get<PaymentMethod[]>('/payment-methods'),
      ]);
      setPayments(paymentsData);
      setEnrollments(enrollmentsData.filter((e) => e.active));
      setStudents(studentsData); // Cargar todos los estudiantes (activos e inactivos) para mostrar info histórica
      setCourses(coursesData);
      setPaymentMethods(methodsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedEnrollment = enrollments.find(e => e.id === formData.enrollmentId);
  const pendingAmount = selectedEnrollment 
    ? selectedEnrollment.totalAmount - selectedEnrollment.paidAmount 
    : 0;

  // Auto-completar monto cuando se selecciona PAGO_TOTAL, limpiar cuando es ABONO
  useEffect(() => {
    if (selectedEnrollment) {
      if (formData.type === 'PAGO_TOTAL') {
        const remaining = selectedEnrollment.totalAmount - selectedEnrollment.paidAmount;
        setFormData(prev => ({ ...prev, amount: remaining }));
      } else if (formData.type === 'ABONO') {
        // Limpiar el monto cuando se cambia a ABONO para que el usuario ingrese el valor
        setFormData(prev => ({ ...prev, amount: 0 }));
      }
    }
  }, [formData.type, selectedEnrollment]);

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    let result = [...payments];

    // Filtro por búsqueda (inscripción)
    if (searchTerm) {
      result = result.filter(payment => {
        const label = getEnrollmentLabel(payment.enrollmentId).toLowerCase();
        return label.includes(searchTerm.toLowerCase());
      });
    }

    // Filtro por tipo
    if (filterType !== 'all') {
      result = result.filter(p => p.type === filterType);
    }

    // Filtro por estado
    if (filterStatus !== 'all') {
      result = result.filter(p => p.status === filterStatus);
    }

    // Filtro por método de pago
    if (filterMethod !== 'all') {
      result = result.filter(p => p.paymentMethodName === filterMethod);
    }

    // Ordenamiento
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'paymentDate') {
        comparison = new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredPayments(result);
    setCurrentPage(1); // Reset a primera página al filtrar
  }, [payments, searchTerm, filterType, filterStatus, filterMethod, sortField, sortOrder]);

  // Paginación
  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getEnrollmentLabel = (enrollmentId: number) => {
    const enrollment = enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) return 'Desconocido';
    const student = students.find((s) => s.id === enrollment.studentId);
    const course = courses.find((c) => c.id === enrollment.courseId);
    return `${student?.firstName || ''} ${student?.lastName || ''} - ${course?.name || ''}`;
  };

  const getPaymentMethodIcon = (methodName: string) => {
    if (methodName?.toLowerCase().includes('efectivo')) return Banknote;
    if (methodName?.toLowerCase().includes('tarjeta')) return CreditCard;
    if (methodName?.toLowerCase().includes('transferencia')) return Building;
    return CreditCard;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
    setFilterMethod('all');
  };

  const handleOpenModal = () => {
    setFormData({
      enrollmentId: 0,
      amount: 0,
      paymentMethodId: paymentMethods[0]?.id || 0,
      type: 'ABONO',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      enrollmentId: 0,
      amount: 0,
      paymentMethodId: paymentMethods[0]?.id || 0,
      type: 'ABONO',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.enrollmentId) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una inscripción.',
        variant: 'destructive',
      });
      return;
    }
    if (formData.amount <= 0) {
      toast({
        title: 'Error',
        description: 'El monto debe ser mayor a 0.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await post<Payment>('/payments', formData);
      toast({
        title: 'Pago registrado',
        description: 'El pago ha sido registrado correctamente.',
      });
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error creating payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (payment: Payment) => {
    setPaymentToDelete(payment);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!paymentToDelete) return;

    try {
      await del(`/payments/${paymentToDelete.id}`);
      toast({
        title: 'Pago cancelado',
        description: 'El pago ha sido cancelado correctamente.',
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting payment:', error);
    } finally {
      setIsDeleteDialogOpen(false);
      setPaymentToDelete(null);
    }
  };

  const columns = [
    { key: 'id', header: 'ID' },
    {
      key: 'enrollment',
      header: 'Inscripción',
      render: (payment: Payment) => (
        <div className="min-w-0">
          <span className="font-medium text-sm block truncate">
            {getEnrollmentLabel(payment.enrollmentId)}
          </span>
        </div>
      ),
    },
    ...(isSuperAdmin() ? [{
      key: 'branch',
      header: 'Sede',
      render: (payment: Payment) => {
        const enrollment = enrollments.find(e => e.id === payment.enrollmentId);
        const student = students.find(s => s.id === enrollment?.studentId);
        if (!student) {
          return (
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">Estudiante no encontrado</span>
            </div>
          );
        }

        // Intentar obtener el nombre de la sede desde los datos del estudiante
        if (student.branch?.name) {
          return (
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{student.branch.name}</span>
              {student.branch.isMain && (
                <span className="inline-flex items-center gap-1 px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Principal
                </span>
              )}
            </div>
          );
        }
        
        // Si no hay datos de branch en el estudiante, buscar en BranchContext
        const branch = branches.find(b => b.id === student.branchId);
        if (branch) {
          return (
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{branch.name}</span>
              {branch.isMain && (
                <span className="inline-flex items-center gap-1 px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Principal
                </span>
              )}
            </div>
          );
        }
        
        // Fallback final
        return (
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">Sede {student.branchId || 'N/A'}</span>
          </div>
        );
      },
    }] : []),
    {
      key: 'amount',
      header: 'Monto',
      render: (payment: Payment) => (
        <span className="font-bold text-success text-sm">${payment.amount.toLocaleString()}</span>
      ),
    },
    {
      key: 'paymentDate',
      header: 'Fecha',
      render: (payment: Payment) => (
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{new Date(payment.paymentDate).toLocaleDateString('es-ES')}</span>
        </div>
      ),
    },
    {
      key: 'paymentMethodName',
      header: 'Método',
      render: (payment: Payment) => {
        const Icon = getPaymentMethodIcon(payment.paymentMethodName);
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="badge-info truncate">{payment.paymentMethodName}</span>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (payment: Payment) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          payment.type === 'PAGO_TOTAL' 
            ? 'bg-success text-success-foreground' 
            : 'bg-primary text-primary-foreground'
        }`}>
          {payment.type === 'PAGO_TOTAL' ? 'Total' : 'Abono'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (payment: Payment) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          payment.status === 'CONFIRMADO' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {payment.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (payment: Payment) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(payment)}
            className="text-destructive hover:text-destructive/80 p-1 sm:p-2"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar title="Pagos" />
        <PageLoader />
      </div>
    );
  }

  const uniquePaymentMethods = Array.from(new Set(payments.map(p => p.paymentMethodName)));

  return (
    <div className="min-h-screen">
      <Navbar title="Pagos" />

      <div className="p-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Pagos</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Registra y administra los pagos y abonos
            </p>
          </div>
          <Button onClick={handleOpenModal} className="btn-primary gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Registrar Pago
          </Button>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm sm:text-base">Filtros</span>
            </div>
            {(searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterMethod !== 'all') && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Limpiar</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar inscripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            {/* Filtro Tipo */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="ABONO">Abono</SelectItem>
                <SelectItem value="PAGO_TOTAL">Pago Total</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro Estado */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                <SelectItem value="ANULADO">Anulado</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro Método */}
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                {uniquePaymentMethods.map(method => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ordenamiento */}
            <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortField(field as 'paymentDate' | 'amount');
              setSortOrder(order as 'asc' | 'desc');
            }}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paymentDate-desc">Fecha (Más reciente)</SelectItem>
                <SelectItem value="paymentDate-asc">Fecha (Más antiguo)</SelectItem>
                <SelectItem value="amount-desc">Monto (Mayor a menor)</SelectItem>
                <SelectItem value="amount-asc">Monto (Menor a mayor)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs sm:text-sm text-muted-foreground">
            Mostrando {paginatedPayments.length} de {filteredPayments.length} pagos
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={paginatedPayments}
            emptyMessage="No hay pagos registrados"
          />
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2 justify-center sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Registrar Pago</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 px-1">
              <div className="space-y-2">
                <Label htmlFor="enrollmentId" className="text-sm font-medium">Inscripción</Label>
                <Select
                  value={formData.enrollmentId ? formData.enrollmentId.toString() : ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, enrollmentId: parseInt(value) })
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecciona una inscripción" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollments.map((enrollment) => {
                      const student = students.find((s) => s.id === enrollment.studentId);
                      const course = courses.find((c) => c.id === enrollment.courseId);
                      const pending = enrollment.totalAmount - enrollment.paidAmount;
                      return (
                        <SelectItem key={enrollment.id} value={enrollment.id.toString()}>
                          <div className="flex flex-col gap-1 py-1">
                            <span className="font-medium truncate">
                              {student?.firstName} {student?.lastName} - {course?.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Pendiente: ${pending.toLocaleString()}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                    }
                    className="text-sm"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentMethodId" className="text-sm font-medium">Método de Pago</Label>
                  <Select
                    value={formData.paymentMethodId ? formData.paymentMethodId.toString() : ''}
                    onValueChange={(value) =>
                      setFormData({ ...formData, paymentMethodId: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Selecciona método" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id.toString()}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">Tipo de Pago</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as 'ABONO' | 'PAGO_TOTAL' })
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABONO">Abono</SelectItem>
                    <SelectItem value="PAGO_TOTAL">Pago Total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedEnrollment && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">Resumen de Inscripción</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      ${selectedEnrollment.totalAmount.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-100 dark:border-green-800">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pagado</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${selectedEnrollment.paidAmount.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-100 dark:border-orange-800">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pendiente</div>
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      ${(selectedEnrollment.totalAmount - selectedEnrollment.paidAmount).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Progreso de pago</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 sm:w-32">
                      <Progress 
                        value={(selectedEnrollment.paidAmount / selectedEnrollment.totalAmount) * 100} 
                        className="h-2" 
                      />
                    </div>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 min-w-[3rem] text-right">
                      {Math.round((selectedEnrollment.paidAmount / selectedEnrollment.totalAmount) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="outline" onClick={handleCloseModal} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" className="btn-primary w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <ButtonLoader /> : 'Registrar Pago'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar este pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará el pago de ${paymentToDelete?.amount.toLocaleString()}.
              El monto será restado del total pagado de la inscripción.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Cancelación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Payments;