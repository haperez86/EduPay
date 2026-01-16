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
import { Progress } from '@/components/ui/progress';
import { useApi } from '@/hooks/useApi';
import { Enrollment, Student, Course, CreateEnrollmentDTO } from '@/types/models';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/BranchContext';
import { Plus, Eye, DollarSign, Calendar, Search, Filter, X, Building } from 'lucide-react';
import { ButtonLoader, PageLoader } from '@/components/ui/LoadingSpinner';

const ITEMS_PER_PAGE = 10;

const Enrollments: React.FC = () => {
  const { get, post } = useApi();
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();
  const branchContext = useBranch();
  const { branches } = branchContext;
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  
  // Ordenamiento
  const [sortField, setSortField] = useState<'enrollmentDate' | 'totalAmount' | 'progress'>('enrollmentDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState<CreateEnrollmentDTO>({
    studentId: 0,
    courseId: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const [enrollmentsData, studentsData, coursesData] = await Promise.all([
        get<Enrollment[]>('/enrollments'),
        get<Student[]>('/students'),
        get<Course[]>('/courses'),
      ]);
      setEnrollments(enrollmentsData);
      setStudents(studentsData); // Cargar todos los estudiantes (activos e inactivos) para mostrar info histórica
      setCourses(coursesData.filter((c) => c.active));
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
    let result = [...enrollments];

    // Filtro por búsqueda (estudiante)
    if (searchTerm) {
      result = result.filter(enrollment => {
        const studentName = getStudentName(enrollment.studentId).toLowerCase();
        return studentName.includes(searchTerm.toLowerCase());
      });
    }

    // Filtro por curso
    if (filterCourse !== 'all') {
      result = result.filter(e => e.courseId === parseInt(filterCourse));
    }

    // Filtro por estado de inscripción
    if (filterStatus !== 'all') {
      const isActive = filterStatus === 'active';
      result = result.filter(e => e.active === isActive);
    }

    // Filtro por estado de pago
    if (filterPaymentStatus === 'paid') {
      result = result.filter(e => e.paidAmount >= e.totalAmount);
    } else if (filterPaymentStatus === 'partial') {
      result = result.filter(e => e.paidAmount > 0 && e.paidAmount < e.totalAmount);
    } else if (filterPaymentStatus === 'pending') {
      result = result.filter(e => e.paidAmount === 0);
    }

    // Ordenamiento
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'enrollmentDate') {
        comparison = new Date(a.enrollmentDate).getTime() - new Date(b.enrollmentDate).getTime();
      } else if (sortField === 'totalAmount') {
        comparison = a.totalAmount - b.totalAmount;
      } else if (sortField === 'progress') {
        comparison = calculateProgress(a) - calculateProgress(b);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredEnrollments(result);
    setCurrentPage(1);
  }, [enrollments, searchTerm, filterCourse, filterStatus, filterPaymentStatus, sortField, sortOrder]);

  // Paginación
  const totalPages = Math.ceil(filteredEnrollments.length / ITEMS_PER_PAGE);
  const paginatedEnrollments = filteredEnrollments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStudentName = (studentId: number) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Desconocido';
  };

  const getCourseName = (courseId: number) => {
    const course = courses.find((c) => c.id === courseId);
    return course?.name || 'Desconocido';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCourse('all');
    setFilterStatus('all');
    setFilterPaymentStatus('all');
  };

  const handleOpenModal = () => {
    setFormData({ studentId: 0, courseId: 0 });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ studentId: 0, courseId: 0 });
  };

  const handleViewDetail = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsDetailModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.courseId) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un estudiante y un curso.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await post<Enrollment>('/enrollments', formData);
      toast({
        title: 'Inscripción creada',
        description: 'La inscripción ha sido registrada correctamente.',
      });
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error creating enrollment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateProgress = (enrollment: Enrollment) => {
    if (enrollment.totalAmount === 0) return 0;
    return Math.round((enrollment.paidAmount / enrollment.totalAmount) * 100);
  };

  const columns = [
    { key: 'id', header: 'ID' },
    {
      key: 'student',
      header: 'Estudiante',
      render: (enrollment: Enrollment) => (
        <div className="min-w-0">
          <span className="font-medium block truncate">{getStudentName(enrollment.studentId)}</span>
        </div>
      ),
    },
    ...(isSuperAdmin() ? [{
      key: 'branch',
      header: 'Sede',
      render: (enrollment: Enrollment) => {
        const student = students.find(s => s.id === enrollment.studentId);
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
      key: 'course',
      header: 'Curso',
      render: (enrollment: Enrollment) => (
        <span className="badge-info truncate block">{getCourseName(enrollment.courseId)}</span>
      ),
    },
    {
      key: 'enrollmentDate',
      header: 'Fecha',
      render: (enrollment: Enrollment) => (
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{new Date(enrollment.enrollmentDate).toLocaleDateString('es-ES')}</span>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total',
      render: (enrollment: Enrollment) => (
        <span className="font-semibold text-sm">${enrollment.totalAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'progress',
      header: 'Progreso',
      render: (enrollment: Enrollment) => {
        const progress = calculateProgress(enrollment);
        return (
          <div className="w-24 sm:w-32">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground truncate">
                ${enrollment.paidAmount.toLocaleString()}
              </span>
              <span className="font-medium flex-shrink-0">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        );
      },
    },
    {
      key: 'pending',
      header: 'Saldo',
      render: (enrollment: Enrollment) => {
        const pending = enrollment.totalAmount - enrollment.paidAmount;
        return (
          <span className={`${pending > 0 ? 'text-warning' : 'text-success'} font-semibold text-sm`}>
            ${pending.toLocaleString()}
          </span>
        );
      },
    },
    {
      key: 'active',
      header: 'Estado',
      render: (enrollment: Enrollment) => (
        <span className={enrollment.active ? 'badge-success' : 'badge-error'}>
          {enrollment.active ? 'Activa' : 'Inactiva'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (enrollment: Enrollment) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetail(enrollment);
          }}
          className="text-primary hover:text-primary/80 p-1 sm:p-2"
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar title="Inscripciones" />
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar title="Inscripciones" />

      <div className="p-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="page-header mb-1">Gestión de Inscripciones</h1>
            <p className="text-muted-foreground">
              Administra las inscripciones de estudiantes a cursos
            </p>
          </div>
          <Button onClick={handleOpenModal} className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            Nueva Inscripción
          </Button>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-card rounded-xl p-4 border border-border mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Filtros</span>
            </div>
            {(searchTerm || filterCourse !== 'all' || filterStatus !== 'all' || filterPaymentStatus !== 'all') && (
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
                placeholder="Buscar estudiante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro Curso */}
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Estado Inscripción */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="inactive">Inactivas</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro Estado de Pago */}
            <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Estado de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pagado completo</SelectItem>
                <SelectItem value="partial">Pago parcial</SelectItem>
                <SelectItem value="pending">Sin pagos</SelectItem>
              </SelectContent>
            </Select>

            {/* Ordenamiento */}
            <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortField(field as 'enrollmentDate' | 'totalAmount' | 'progress');
              setSortOrder(order as 'asc' | 'desc');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enrollmentDate-desc">Fecha (Más reciente)</SelectItem>
                <SelectItem value="enrollmentDate-asc">Fecha (Más antiguo)</SelectItem>
                <SelectItem value="totalAmount-desc">Monto (Mayor a menor)</SelectItem>
                <SelectItem value="totalAmount-asc">Monto (Menor a mayor)</SelectItem>
                <SelectItem value="progress-desc">Progreso (Mayor a menor)</SelectItem>
                <SelectItem value="progress-asc">Progreso (Menor a mayor)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Mostrando {paginatedEnrollments.length} de {filteredEnrollments.length} inscripciones
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={paginatedEnrollments}
          emptyMessage="No hay inscripciones registradas"
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
            <DialogTitle>Nueva Inscripción</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Estudiante</Label>
                <Select
                  value={formData.studentId ? formData.studentId.toString() : ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, studentId: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estudiante" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.filter((student) => student.active).map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.firstName} {student.lastName} - {student.documentNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Curso</Label>
                <Select
                  value={formData.courseId ? formData.courseId.toString() : ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, courseId: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.name} - ${course.price.toLocaleString()}
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
                {isSubmitting ? <ButtonLoader /> : 'Crear Inscripción'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de Inscripción</DialogTitle>
          </DialogHeader>
          {selectedEnrollment && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Estudiante</p>
                  <p className="font-medium">
                    {getStudentName(selectedEnrollment.studentId)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Curso</p>
                  <p className="font-medium">
                    {getCourseName(selectedEnrollment.courseId)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Inscripción</p>
                  <p className="font-medium">
                    {new Date(selectedEnrollment.enrollmentDate).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <span className={selectedEnrollment.active ? 'badge-success' : 'badge-error'}>
                    {selectedEnrollment.active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Estado Financiero
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-semibold">
                      ${selectedEnrollment.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pagado:</span>
                    <span className="font-semibold text-success">
                      ${selectedEnrollment.paidAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pendiente:</span>
                    <span className="font-semibold text-warning">
                      ${(selectedEnrollment.totalAmount - selectedEnrollment.paidAmount).toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={calculateProgress(selectedEnrollment)}
                    className="h-3 mt-2"
                  />
                  <p className="text-center text-sm text-muted-foreground">
                    {calculateProgress(selectedEnrollment)}% completado
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Enrollments;