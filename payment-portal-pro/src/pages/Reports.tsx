import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { Progress } from '@/components/ui/progress';
import { useApi } from '@/hooks/useApi';
import { Student, Course, Enrollment } from '@/types/models';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/BranchContext';
import {
  Users,
  BookOpen,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Building,
} from 'lucide-react';
import { PageLoader } from '@/components/ui/LoadingSpinner';

interface StudentDebt {
  id: number;
  student: Student;
  totalDebt: number;
  enrollmentsCount: number;
}

interface CourseSummary {
  id: number;
  course: Course;
  totalEnrollments: number;
  totalRevenue: number;
  totalPending: number;
  collectionRate: number;
}

const Reports: React.FC = () => {
  const { get } = useApi();
  const { isSuperAdmin } = useAuth();
  const branchContext = useBranch();
  const { branches } = branchContext;
  const [isLoading, setIsLoading] = useState(true);
  const [studentsWithDebt, setStudentsWithDebt] = useState<StudentDebt[]>([]);
  const [courseSummaries, setCourseSummaries] = useState<CourseSummary[]>([]);
  const [totals, setTotals] = useState({
    totalStudentsWithDebt: 0,
    totalDebt: 0,
    totalRevenue: 0,
    collectionRate: 0,
  });

  const fetchReportData = useCallback(async () => {
    try {
      const [students, courses, enrollments] = await Promise.all([
        get<Student[]>('/students'),
        get<Course[]>('/courses'),
        get<Enrollment[]>('/enrollments'),
      ]);

      // Calculate students with debt
      const debtList: StudentDebt[] = [];
      students.forEach((student) => {
        const studentEnrollments = enrollments.filter((e) => e.studentId === student.id);
        const totalDebt = studentEnrollments.reduce(
          (sum, e) => sum + (e.totalAmount - e.paidAmount),
          0
        );
        if (totalDebt > 0) {
          debtList.push({
            id: student.id,
            student,
            totalDebt,
            enrollmentsCount: studentEnrollments.length,
          });
        }
      });
      debtList.sort((a, b) => b.totalDebt - a.totalDebt);
      setStudentsWithDebt(debtList);

      // Calculate course summaries
      const summaries: CourseSummary[] = [];
      courses.forEach((course) => {
        const courseEnrollments = enrollments.filter((e) => e.courseId === course.id);
        const totalRevenue = courseEnrollments.reduce((sum, e) => sum + e.paidAmount, 0);
        const totalAmount = courseEnrollments.reduce((sum, e) => sum + e.totalAmount, 0);
        const totalPending = totalAmount - totalRevenue;
        const collectionRate = totalAmount > 0 ? (totalRevenue / totalAmount) * 100 : 0;

        if (courseEnrollments.length > 0) {
          summaries.push({
            id: course.id,
            course,
            totalEnrollments: courseEnrollments.length,
            totalRevenue,
            totalPending,
            collectionRate,
          });
        }
      });
      summaries.sort((a, b) => b.totalRevenue - a.totalRevenue);
      setCourseSummaries(summaries);

      // Calculate totals
      const totalDebt = debtList.reduce((sum, d) => sum + d.totalDebt, 0);
      const totalRevenue = enrollments.reduce((sum, e) => sum + e.paidAmount, 0);
      const totalAmount = enrollments.reduce((sum, e) => sum + e.totalAmount, 0);
      const collectionRate = totalAmount > 0 ? (totalRevenue / totalAmount) * 100 : 0;

      setTotals({
        totalStudentsWithDebt: debtList.length,
        totalDebt,
        totalRevenue,
        collectionRate,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const debtColumns = [
    {
      key: 'student',
      header: 'Estudiante',
      render: (item: StudentDebt) => (
        <div className="min-w-0">
          <span className="font-medium block truncate">
            {item.student.firstName} {item.student.lastName}
          </span>
          <p className="text-xs text-muted-foreground truncate">{item.student.email}</p>
        </div>
      ),
    },
    { 
      key: 'documentNumber', 
      header: 'Documento', 
      render: (item: StudentDebt) => (
        <span className="text-sm truncate">{item.student.documentNumber}</span>
      )
    },
    ...(isSuperAdmin() ? [{
      key: 'branch',
      header: 'Sede',
      render: (item: StudentDebt) => {
        // Intentar obtener el nombre de la sede desde los datos del estudiante
        if (item.student.branch?.name) {
          return (
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{item.student.branch.name}</span>
              {item.student.branch.isMain && (
                <span className="inline-flex items-center gap-1 px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Principal
                </span>
              )}
            </div>
          );
        }
        
        // Si no hay datos de branch en el estudiante, buscar en BranchContext
        const branch = branches.find(b => b.id === item.student.branchId);
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
            <span className="truncate">Sede {item.student.branchId || 'N/A'}</span>
          </div>
        );
      },
    }] : []),
    {
      key: 'enrollmentsCount',
      header: 'Inscripciones',
      render: (item: StudentDebt) => (
        <span className="text-sm">{item.enrollmentsCount}</span>
      ),
    },
    {
      key: 'totalDebt',
      header: 'Deuda Total',
      render: (item: StudentDebt) => (
        <span className="font-bold text-destructive text-sm">
          ${item.totalDebt.toLocaleString()}
        </span>
      ),
    },
  ];

  const courseColumns = [
    {
      key: 'course',
      header: 'Curso',
      render: (item: CourseSummary) => (
        <span className="font-medium truncate block">{item.course.name}</span>
      ),
    },
    ...(isSuperAdmin() ? [{
      key: 'branch',
      header: 'Sede',
      render: (item: CourseSummary) => (
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate">Todas las sedes</span>
        </div>
      ),
    }] : []),
    {
      key: 'totalEnrollments',
      header: 'Inscripciones',
      render: (item: CourseSummary) => (
        <span className="text-sm">{item.totalEnrollments}</span>
      ),
    },
    {
      key: 'totalRevenue',
      header: 'Recaudado',
      render: (item: CourseSummary) => (
        <span className="font-semibold text-success text-sm">
          ${item.totalRevenue.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'totalPending',
      header: 'Pendiente',
      render: (item: CourseSummary) => (
        <span className="font-semibold text-warning text-sm">
          ${item.totalPending.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'collectionRate',
      header: 'Tasa de Cobro',
      render: (item: CourseSummary) => (
        <div className="w-20 sm:w-24">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium truncate">{item.collectionRate.toFixed(1)}%</span>
          </div>
          <Progress value={item.collectionRate} className="h-2" />
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar title="Reportes" />
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar title="Reportes" />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Reportes Administrativos</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Consulta el estado financiero y análisis del sistema
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div className="sm:col-span-2 lg:col-span-1">
            <StatCard
              title="Estudiantes con Deuda"
              value={totals.totalStudentsWithDebt}
              icon={Users}
              variant="warning"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <StatCard
              title="Deuda Total"
              value={`$${totals.totalDebt.toLocaleString()}`}
              icon={AlertTriangle}
              variant="error"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <StatCard
              title="Total Recaudado"
              value={`$${totals.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              variant="success"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <StatCard
              title="Tasa de Cobro"
              value={`${totals.collectionRate.toFixed(1)}%`}
              icon={TrendingUp}
              variant="primary"
            />
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Students with Debt */}
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                Estudiantes con Deuda
              </h2>
            </div>
            <div className="overflow-x-auto">
              <DataTable
                columns={debtColumns}
                data={studentsWithDebt}
                emptyMessage="No hay estudiantes con deuda"
              />
            </div>
          </div>

          {/* Course Summaries */}
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                Resumen por Curso
              </h2>
            </div>
            <div className="overflow-x-auto">
              <DataTable
                columns={courseColumns}
                data={courseSummaries}
                emptyMessage="No hay datos de cursos"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
