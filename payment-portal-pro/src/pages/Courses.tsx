import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Course, CreateCourseDTO } from '@/types/models';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, BookX, BookCheck, Search, Clock, DollarSign, Filter, X } from 'lucide-react';
import { ButtonLoader, PageLoader } from '@/components/ui/LoadingSpinner';

const initialFormState: CreateCourseDTO = {
  name: '',
  description: '',
  price: 0,
  totalHours: 0,
};

const ITEMS_PER_PAGE = 10;

const Courses: React.FC = () => {
  const { get, post, put, patch } = useApi();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CreateCourseDTO>(initialFormState);
  
  // Filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCourses = useCallback(async () => {
    try {
      const data = await get<Course[]>('/courses');
      setCourses(data);
      setFilteredCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    let filtered = courses.filter((course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filtro por estado
    if (filterStatus !== 'all') {
      const isActive = filterStatus === 'active';
      filtered = filtered.filter(c => c.active === isActive);
    }

    // Ordenamiento por precio
    filtered.sort((a, b) => {
      return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    });

    setFilteredCourses(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortOrder, courses]);

  // Paginación
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setSortOrder('asc');
  };

  const handleOpenModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        name: course.name,
        description: course.description,
        price: course.price,
        totalHours: course.totalHours,
      });
    } else {
      setEditingCourse(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingCourse) {
        await put<Course>(`/courses/${editingCourse.id}`, formData);
        toast({
          title: 'Curso actualizado',
          description: 'Los datos del curso han sido actualizados correctamente.',
        });
      } else {
        await post<Course>('/courses', formData);
        toast({
          title: 'Curso creado',
          description: 'El curso ha sido registrado correctamente.',
        });
      }
      handleCloseModal();
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (course: Course) => {
    try {
      await patch(`/courses/${course.id}/toggle-status`);
      toast({
        title: course.active ? 'Curso desactivado' : 'Curso activado',
        description: `${course.name} ha sido ${course.active ? 'desactivado' : 'activado'}.`,
      });
      fetchCourses();
    } catch (error) {
      console.error('Error toggling course status:', error);
    }
  };

  const columns = [
    { key: 'id', header: 'ID' },
    {
      key: 'name',
      header: 'Nombre del Curso',
      render: (course: Course) => <span className="font-medium">{course.name}</span>,
    },
    {
      key: 'description',
      header: 'Descripción',
      render: (course: Course) => (
        <span className="text-muted-foreground truncate max-w-xs block">
          {course.description}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Precio',
      render: (course: Course) => (
        <div className="flex items-center gap-1 text-success font-semibold">
          <DollarSign className="w-4 h-4" />
          {course.price.toLocaleString()}
        </div>
      ),
    },
    {
      key: 'totalHours',
      header: 'Horas',
      render: (course: Course) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-4 h-4" />
          {course.totalHours}h
        </div>
      ),
    },
    {
      key: 'active',
      header: 'Estado',
      render: (course: Course) => (
        <span className={course.active ? 'badge-success' : 'badge-error'}>
          {course.active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (course: Course) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal(course);
            }}
            className="text-primary hover:text-primary/80"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(course);
            }}
            className={course.active ? 'text-destructive hover:text-destructive/80' : 'text-success hover:text-success/80'}
          >
            {course.active ? <BookX className="w-4 h-4" /> : <BookCheck className="w-4 h-4" />}
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar title="Cursos" />
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar title="Cursos" />

      <div className="p-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="page-header mb-1">Gestión de Cursos</h1>
            <p className="text-muted-foreground">
              Administra el catálogo de cursos disponibles
            </p>
          </div>
          <Button onClick={() => handleOpenModal()} className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Curso
          </Button>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-card rounded-xl p-4 border border-border mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Filtros</span>
            </div>
            {(searchTerm || filterStatus !== 'all' || sortOrder !== 'asc') && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                <X className="w-4 h-4" />
                Limpiar filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de curso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por precio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Precio: Menor a Mayor</SelectItem>
                <SelectItem value="desc">Precio: Mayor a Menor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Mostrando {paginatedCourses.length} de {filteredCourses.length} cursos
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={paginatedCourses}
          emptyMessage="No hay cursos registrados"
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

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? 'Editar Curso' : 'Nuevo Curso'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Curso</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalHours">Horas Totales</Label>
                  <Input
                    id="totalHours"
                    type="number"
                    min="1"
                    value={formData.totalHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalHours: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? <ButtonLoader /> : editingCourse ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Courses;