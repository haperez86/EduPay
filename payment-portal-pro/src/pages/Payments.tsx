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
import { Plus, Trash2, Calendar, CreditCard, Banknote, Building, Search, Filter, X } from 'lucide-react';
import { ButtonLoader, PageLoader } from '@/components/ui/LoadingSpinner';

interface PaymentMethod {
  id: number;
  name: string;
}

const ITEMS_PER_PAGE = 10;

const Payments: React.FC = () => {
  const { get, post, del } = useApi();
  const { toast } = useToast();
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
      setStudents(studentsData);
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

  const selectedEnrollment = enrollments.find(e => e.id === formData.enrollmentId);
  const pendingAmount = selectedEnrollment 
    ? selectedEnrollment.totalAmount - selectedEnrollment.paidAmount 
    : 0;

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
        <span className="font-medium text-sm">
          {getEnrollmentLabel(payment.enrollmentId)}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      render: (payment: Payment) => (
        <span className="font-bold text-success">${payment.amount.toLocaleString()}</span>
      ),
    },
    {
      key: 'paymentDate',
      header: 'Fecha',
      render: (payment: Payment) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {new Date(payment.paymentDate).toLocaleDateString('es-ES')}
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
            <Icon className="w-4 h-4 text-primary" />
            <span className="badge-info">{payment.paymentMethodName}</span>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (payment: Payment) => (
        <span className={payment.type === 'PAGO_TOTAL' ? 'badge-success' : 'badge-info'}>
          {payment.type === 'PAGO_TOTAL' ? 'Pago Total' : 'Abono'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (payment: Payment) => (
        <span className={payment.status === 'CONFIRMADO' ? 'badge-success' : 'badge-error'}>
          {payment.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (payment: Payment) =>
        payment.status === 'CONFIRMADO' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(payment);
            }}
            className="text-destructive hover:text-destructive/80"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
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
            <h1 className="page-header mb-1">Gestión de Pagos</h1>
            <p className="text-muted-foreground">
              Registra y administra los pagos y abonos
            </p>
          </div>
          <Button onClick={handleOpenModal} className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            Registrar Pago
          </Button>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-card rounded-xl p-4 border border-border mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Filtros</span>
            </div>
            {(searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterMethod !== 'all') && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                <X className="w-4 h-4" />
                Limpiar filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar inscripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro Tipo */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
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
              <SelectTrigger>
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
              <SelectTrigger>
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
              <SelectTrigger>
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

          <div className="text-sm text-muted-foreground">
            Mostrando {paginatedPayments.length} de {filteredPayments.length} pagos
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={paginatedPayments}
          emptyMessage="No hay pagos registrados"
        />

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Inscripción</Label>
                <Select
                  value={formData.enrollmentId ? formData.enrollmentId.toString() : ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, enrollmentId: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una inscripción" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollments.map((enrollment) => {
                      const student = students.find((s) => s.id === enrollment.studentId);
                      const course = courses.find((c) => c.id === enrollment.courseId);
                      const pending = enrollment.totalAmount - enrollment.paidAmount;
                      return (
                        <SelectItem key={enrollment.id} value={enrollment.id.toString()}>
                          <div className="flex flex-col">
                            <span>
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
              
              <div className="space-y-2">
                <Label>Tipo de Pago</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    const newType = value as 'ABONO' | 'PAGO_TOTAL';
                    setFormData({
                      ...formData,
                      type: newType,
                      amount: newType === 'PAGO_TOTAL' ? pendingAmount : 0,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABONO">Abono</SelectItem>
                    <SelectItem value="PAGO_TOTAL">Pago Total</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Monto ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                  }
                  disabled={formData.type === 'PAGO_TOTAL'}
                  required
                />
                {formData.type === 'PAGO_TOTAL' && (
                  <p className="text-xs text-muted-foreground">
                    Monto bloqueado: saldo pendiente de ${pendingAmount.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select
                  value={formData.paymentMethodId?.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      paymentMethodId: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-primary" disabled={isSubmitting}>
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
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="btn-destructive"
            >
              Sí, cancelar pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Payments;