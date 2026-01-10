import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { Progress } from '@/components/ui/progress';
import { useApi } from '@/hooks/useApi';
import { Student, Course, Enrollment } from '@/types/models';
import {
  Users,
  BookOpen,
  AlertTriangle,
  DollarSign,
  TrendingUp,
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
        <div>
          <span className="font-medium">
            {item.student.firstName} {item.student.lastName}
          </span>
          <p className="text-xs text-muted-foreground">{item.student.email}</p>
        </div>
      ),
    },
    { 
      key: 'documentNumber', 
      header: 'Documento', 
      render: (item: StudentDebt) => item.student.documentNumber 
    },
    {
      key: 'enrollmentsCount',
      header: 'Inscripciones',
      render: (item: StudentDebt) => (
        <span className="text-sm">{item.enrollmentsCount}</span>  // Quita el badge-info
      ),
    },
    {
      key: 'totalDebt',
      header: 'Deuda Total',
      render: (item: StudentDebt) => (
        <span className="font-bold text-destructive">
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
        <span className="font-medium">{item.course.name}</span>
      ),
    },
    {
      key: 'totalEnrollments',
      header: 'Inscripciones',
      render: (item: CourseSummary) => (
        <span className="text-sm">{item.totalEnrollments}</span>  // Quita el badge-info
      ),
    },
    {
      key: 'totalRevenue',
      header: 'Recaudado',
      render: (item: CourseSummary) => (
        <span className="font-semibold text-success">
          ${item.totalRevenue.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'totalPending',
      header: 'Pendiente',
      render: (item: CourseSummary) => (
        <span className="font-semibold text-warning">
          ${item.totalPending.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'collectionRate',
      header: 'Tasa de Cobro',
      render: (item: CourseSummary) => (
        <div className="w-24">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium">{item.collectionRate.toFixed(1)}%</span>
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

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="page-header mb-1">Reportes Administrativos</h1>
          <p className="text-muted-foreground">
            Consulta el estado financiero y análisis del sistema
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Estudiantes con Deuda"
            value={totals.totalStudentsWithDebt}
            icon={Users}
            variant="warning"
          />
          <StatCard
            title="Deuda Total"
            value={`$${totals.totalDebt.toLocaleString()}`}
            icon={AlertTriangle}
            variant="error"
          />
          <StatCard
            title="Total Recaudado"
            value={`$${totals.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            variant="success"
          />
          <StatCard
            title="Tasa de Cobro"
            value={`${totals.collectionRate.toFixed(1)}%`}
            icon={TrendingUp}
            variant="primary"
          />
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Students with Debt */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h2 className="text-lg font-semibold text-foreground">
                Estudiantes con Deuda
              </h2>
            </div>
            <DataTable
              columns={debtColumns}
              data={studentsWithDebt}
              emptyMessage="No hay estudiantes con deuda"
            />
          </div>

          {/* Course Summaries */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Resumen por Curso
              </h2>
            </div>
            <DataTable
              columns={courseColumns}
              data={courseSummaries}
              emptyMessage="No hay datos de cursos"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
