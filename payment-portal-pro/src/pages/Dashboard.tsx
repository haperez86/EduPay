import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { useApi } from '@/hooks/useApi';
import { Student, Course, Enrollment, Payment } from '@/types/models';
import {
  Users,
  BookOpen,
  ClipboardList,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const Dashboard: React.FC = () => {
  const { get } = useApi();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalPayments: 0,
    totalRevenue: 0,
    pendingAmount: 0,
  });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [studentsWithDebt, setStudentsWithDebt] = useState<Enrollment[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [students, courses, enrollments, payments] = await Promise.all([
          get<Student[]>('/students').catch((): Student[] => []),
          get<Course[]>('/courses').catch((): Course[] => []),
          get<Enrollment[]>('/enrollments').catch((): Enrollment[] => []),
          get<Payment[]>('/payments').catch((): Payment[] => []),
        ]);

        const activeStudents = students.filter((s) => s.active);
        const activeCourses = courses.filter((c) => c.active);
        const activePayments = payments.filter((p) => p.status === 'CONFIRMADO');

        const totalRevenue = activePayments.reduce((sum, p) => sum + p.amount, 0);
        const totalAmount = enrollments.reduce((sum, e) => sum + e.totalAmount, 0);
        const totalPaid = enrollments.reduce((sum, e) => sum + e.paidAmount, 0);

        setStats({
          totalStudents: activeStudents.length,
          totalCourses: activeCourses.length,
          totalEnrollments: enrollments.length,
          totalPayments: activePayments.length,
          totalRevenue,
          pendingAmount: totalAmount - totalPaid,
        });

        setRecentPayments(payments.slice(0, 5));
        
        // Students with pending payments
        const studentsWithPending = enrollments
        .filter((e) => e.totalAmount > e.paidAmount)
        .slice(0, 5);

      setStudentsWithDebt(studentsWithPending);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [get]);

  const paymentColumns = [
    { key: 'id', header: 'ID' },
    {
      key: 'amount',
      header: 'Monto',
      render: (payment: Payment) => (
        <span className="font-semibold text-success">
          ${payment.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'paymentMethodName',
      header: 'Método',
      render: (payment: Payment) => (
        <span className="badge-info">{payment.paymentMethodName}</span>
      ),
    },
    {
      key: 'paymentDate',
      header: 'Fecha',
      render: (payment: Payment) =>
        new Date(payment.paymentDate).toLocaleDateString('es-ES'),
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
  ];

  const debtColumns = [
    {
      key: 'studentName',
      header: 'Estudiante',
      render: (enrollment: Enrollment) => (
        <span className="font-medium">{enrollment.studentName}</span>
      ),
    },
    { 
      key: 'studentDocument', 
      header: 'Documento',
      render: (enrollment: Enrollment) => enrollment.studentDocument
    },
    { 
      key: 'studentEmail', 
      header: 'Email',
      render: (enrollment: Enrollment) => enrollment.studentEmail
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar title="Dashboard" />
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar title="Dashboard" />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Estudiantes"
            value={stats.totalStudents}
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Cursos"
            value={stats.totalCourses}
            icon={BookOpen}
            variant="default"
          />
          <StatCard
            title="Inscripciones"
            value={stats.totalEnrollments}
            icon={ClipboardList}
            variant="default"
          />
          <StatCard
            title="Pagos Recibidos"
            value={stats.totalPayments}
            icon={DollarSign}
            variant="success"
          />
          <StatCard
            title="Ingresos Totales"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Saldo Pendiente"
            value={`$${stats.pendingAmount.toLocaleString()}`}
            icon={AlertCircle}
            variant="warning"
          />
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Pagos Recientes
            </h2>
            <DataTable
              columns={paymentColumns}
              data={recentPayments}
              emptyMessage="No hay pagos registrados"
            />
          </div>

          {/* Students with Debt */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Estudiantes con Saldo Pendiente
            </h2>
            <DataTable
              columns={debtColumns}
              data={studentsWithDebt}
              emptyMessage="No hay estudiantes con deuda"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
