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
import { useApi } from '@/hooks/useApi';
import { Student, CreateStudentDTO, Branch } from '@/types/models';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/BranchContext';
import { Plus, Edit, UserX, Search, UserCheck, Filter, X, Building } from 'lucide-react';
import { ButtonLoader, PageLoader } from '@/components/ui/LoadingSpinner';

const initialFormState: CreateStudentDTO = {
  firstName: '',
  lastName: '',
  documentNumber: '',
  email: '',
  phone: '',
  branchId: undefined,
};

const ITEMS_PER_PAGE = 10;

const Students: React.FC = () => {
  const { get, post, put, patch } = useApi();
  const { toast } = useToast();
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const { branches, selectedBranch } = useBranch();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<CreateStudentDTO>(initialFormState);
  
  // Filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchStudents = useCallback(async () => {
    try {
      let url = '/students?';
      const params = new URLSearchParams();
      
      // Agregar filtros
      if (filterStatus !== 'all') {
        params.append('active', filterStatus === 'active' ? 'true' : 'false');
      }
      
      // Para SUPER_ADMIN, permitir filtrar por sede
      if (isSuperAdmin() && filterBranch !== 'all') {
        params.append('branchId', filterBranch);
      }
      
      // Para búsqueda por documento
      if (searchTerm) {
        params.append('document', searchTerm);
      }
      
      url += params.toString();
      
      const data = await get<Student[]>(url);
      setStudents(data);
      setFilteredStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los estudiantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [get, filterStatus, filterBranch, searchTerm, isSuperAdmin, toast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    let filtered = students.filter(
      (student) =>
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.documentNumber.includes(searchTerm)
    );

    // Filtro por estado
    if (filterStatus !== 'all') {
      const isActive = filterStatus === 'active';
      filtered = filtered.filter(s => s.active === isActive);
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterStatus, students]);

  // Paginación
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
  };

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        documentNumber: student.documentNumber,
        email: student.email,
        phone: student.phone,
        branchId: student.branchId,
      });
    } else {
      setEditingStudent(null);
      setFormData({
        ...initialFormState,
        branchId: isAdmin() ? user?.branch?.id : undefined,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingStudent) {
        await put<Student>(`/students/${editingStudent.id}`, formData);
        toast({
          title: 'Estudiante actualizado',
          description: 'Los datos del estudiante han sido actualizados correctamente.',
        });
      } else {
        await post<Student>('/students', formData);
        toast({
          title: 'Estudiante creado',
          description: 'El estudiante ha sido registrado correctamente.',
        });
      }
      handleCloseModal();
      fetchStudents();
    } catch (error: any) {
      console.error('Error saving student:', error);
      
      let errorMessage = 'Ocurrió un error al guardar el estudiante.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (student: Student) => {
    try {
      await patch(`/students/${student.id}/toggle-status`);
      toast({
        title: student.active ? 'Estudiante desactivado' : 'Estudiante activado',
        description: `${student.firstName} ${student.lastName} ha sido ${student.active ? 'desactivado' : 'activado'}.`,
      });
      fetchStudents();
    } catch (error) {
      console.error('Error toggling student status:', error);
    }
  };

  const columns = [
    { key: 'id', header: 'ID' },
    {
      key: 'name',
      header: 'Nombre Completo',
      render: (student: Student) => (
        <div className="min-w-0">
          <span className="font-medium block truncate">{`${student.firstName} ${student.lastName}`}</span>
          {student.email && (
            <span className="text-xs text-muted-foreground truncate block">{student.email}</span>
          )}
        </div>
      ),
    },
    { key: 'documentNumber', header: 'Documento' },
    ...(isSuperAdmin() ? [{
      key: 'branch',
      header: 'Sede',
      render: (student: Student) => {
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
    { key: 'phone', header: 'Teléfono' },
    {
      key: 'active',
      header: 'Estado',
      render: (student: Student) => (
        <span className={student.active ? 'badge-success' : 'badge-error'}>
          {student.active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (student: Student) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal(student);
            }}
            className="text-primary hover:text-primary/80 p-1 sm:p-2"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(student);
            }}
            className={student.active ? 'text-destructive hover:text-destructive/80 p-1 sm:p-2' : 'text-success hover:text-success/80 p-1 sm:p-2'}
          >
            {student.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar title="Estudiantes" />
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar title="Estudiantes" />

      <div className="p-4 sm:p-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Gestión de Estudiantes</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Administra el registro de estudiantes del sistema
            </p>
          </div>
          <Button onClick={() => handleOpenModal()} className="btn-primary gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Nuevo Estudiante
          </Button>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm sm:text-base">Filtros</span>
            </div>
            {(searchTerm || filterStatus !== 'all') && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Limpiar</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs sm:text-sm text-muted-foreground">
            Mostrando {paginatedStudents.length} de {filteredStudents.length} estudiantes
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={paginatedStudents}
            emptyMessage="No hay estudiantes registrados"
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

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editingStudent ? 'Editar Estudiante' : 'Nuevo Estudiante'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 px-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">Nombre</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="text-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">Apellido</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="text-sm"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentNumber" className="text-sm font-medium">Número de Documento</Label>
                <Input
                  id="documentNumber"
                  value={formData.documentNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, documentNumber: e.target.value })
                  }
                  className="text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="text-sm"
                  required
                />
              </div>
              
              {/* Campo de Sede - para SUPER_ADMIN (editable) y ADMIN (solo lectura) */}
              {(isSuperAdmin() || isAdmin()) && (
                <div className="space-y-2">
                  <Label htmlFor="branchId" className="text-sm font-medium">Sede</Label>
                  <Select
                    value={formData.branchId?.toString() || (isAdmin() ? user?.branch?.id?.toString() : '')}
                    onValueChange={(value) =>
                      isSuperAdmin() && setFormData({ ...formData, branchId: value ? parseInt(value) : undefined })
                    }
                    disabled={!isSuperAdmin()}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Seleccionar sede" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            <span className="truncate">{branch.name}</span>
                            {branch.isMain && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                Principal
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="outline" onClick={handleCloseModal} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" className="btn-primary w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <ButtonLoader /> : editingStudent ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Students;