import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { BranchSelector } from '@/components/BranchSelector';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/BranchContext';
import { Student, Course, Enrollment, Payment } from '@/types/models';
import {
  Users,
  BookOpen,
  ClipboardList,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Building,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  CreditCard,
} from 'lucide-react';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { get } = useApi();
  const { user, isSuperAdmin, isAdmin, getCurrentBranch } = useAuth();
  const { selectedBranch, setSelectedBranch, getCurrentBranchId } = useBranch();
  const [isLoading, setIsLoading] = useState(true);
  const [showBranchSelector, setShowBranchSelector] = useState(false);
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

  const getDashboardTitle = () => {
    if (isSuperAdmin() && !selectedBranch) {
      return "Panel de Administración Global";
    } else if (isSuperAdmin() && selectedBranch) {
      return `Panel - ${selectedBranch.name}`;
    } else if (isAdmin()) {
      const branch = getCurrentBranch();
      return `Panel - ${branch?.name || 'Sede'}`;
    } else {
      return "Panel Estudiantil";
    }
  };

  const getApiEndpoint = (baseEndpoint: string) => {
    const branchId = getCurrentBranchId();
    if (branchId && (isSuperAdmin() || isAdmin())) {
      return `${baseEndpoint}?branchId=${branchId}`;
    }
    return baseEndpoint;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [students, courses, enrollments, payments] = await Promise.all([
          get<Student[]>(getApiEndpoint('/students')).catch((): Student[] => []),
          get<Course[]>(getApiEndpoint('/courses')).catch((): Course[] => []),
          get<Enrollment[]>(getApiEndpoint('/enrollments')).catch((): Enrollment[] => []),
          get<Payment[]>(getApiEndpoint('/payments')).catch((): Payment[] => []),
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
  }, [get, getCurrentBranchId, isSuperAdmin, isAdmin]);

  const paymentColumns = [
    { key: 'id', header: 'ID' },
    {
      key: 'amount',
      header: 'Monto',
      render: (payment: Payment) => (
        <span className="font-semibold text-green-600">
          ${payment.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'paymentMethodName',
      header: 'Método',
      render: (payment: Payment) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
          {payment.paymentMethodName}
        </span>
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
        <span className={`px-2 py-1 text-xs rounded-full ${
          payment.status === 'CONFIRMADO' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
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
        <span className="font-medium">{enrollment.studentName || 'N/A'}</span>
      ),
    },
    { 
      key: 'studentDocument', 
      header: 'Documento',
      render: (enrollment: Enrollment) => enrollment.studentDocument || 'N/A'
    },
    { 
      key: 'totalAmount', 
      header: 'Total',
      render: (enrollment: Enrollment) => (
        <span className="font-semibold">
          ${enrollment.totalAmount.toLocaleString()}
        </span>
      )
    },
    { 
      key: 'pendingAmount', 
      header: 'Pendiente',
      render: (enrollment: Enrollment) => {
        const pending = enrollment.totalAmount - enrollment.paidAmount;
        return (
          <span className="font-semibold text-red-600">
            ${pending.toLocaleString()}
          </span>
        );
      }
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar title={getDashboardTitle()} />
        <PageLoader />
      </div>
    );
  }

  // Show branch info for ADMIN users
  if (isAdmin() && user?.branch) {
    return (
      <div className="min-h-screen">
        <Navbar title={getDashboardTitle()} />
        <div className="p-6">
          {/* Branch Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {user.branch.name}
              </CardTitle>
              <CardDescription>
                {user.branch.isMain && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mr-2">
                    <CheckCircle className="w-3 h-3" />
                    Sede Principal
                  </span>
                )}
                Tu sede asignada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {user.branch.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{user.branch.address}</span>
                  </div>
                )}
                {user.branch.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{user.branch.phone}</span>
                  </div>
                )}
                {user.branch.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{user.branch.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estudiantes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">En tu sede</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cursos</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">Disponibles</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inscripciones</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
                <p className="text-xs text-muted-foreground">Activas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagos</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPayments}</div>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </CardContent>
            </Card>
          </div>

          {/* Management Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Estudiantes
                </CardTitle>
                <CardDescription>Gestionar estudiantes de tu sede</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/students" className="text-blue-600 hover:text-blue-800 text-sm">
                  Ver estudiantes →
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Cursos
                </CardTitle>
                <CardDescription>Administrar cursos disponibles</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/courses" className="text-blue-600 hover:text-blue-800 text-sm">
                  Ver cursos →
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Inscripciones
                </CardTitle>
                <CardDescription>Gestionar inscripciones activas</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/enrollments" className="text-blue-600 hover:text-blue-800 text-sm">
                  Ver inscripciones →
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pagos
                </CardTitle>
                <CardDescription>Control de pagos y finanzas</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/payments" className="text-blue-600 hover:text-blue-800 text-sm">
                  Ver pagos →
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show branch selector for SUPER_ADMIN when no branch is selected
  if (isSuperAdmin() && !selectedBranch) {
    return (
      <div className="min-h-screen">
        <Navbar title={getDashboardTitle()} />
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vista Global - Todas las Sedes</h1>
            <p className="text-gray-600">Selecciona una sede para gestionar o ver reportes consolidados</p>
          </div>
          
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Sedes Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-sm text-gray-600">Duitama, Sogamoso, Soatá, Socha</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Reportes Consolidados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link to="/reports">
                  <Button className="w-full">Ver Reportes Globales</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestión Multi-Sede
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => setShowBranchSelector(true)}
                >
                  Gestionar Sedes
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Branch Selector */}
          <BranchSelector 
            onBranchSelect={(branch) => {
              setSelectedBranch(branch);
              setShowBranchSelector(false);
            }}
          />
        </div>
      </div>
    );
  }

  // Regular dashboard for all roles
  return (
    <div className="min-h-screen">
      <Navbar title={getDashboardTitle()} />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Branch info for non-student roles */}
        {(isSuperAdmin() || isAdmin()) && selectedBranch && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">
                  {isSuperAdmin() ? 'Gestionando:' : 'Sede:'} {selectedBranch.name}
                </h2>
                <p className="text-sm text-gray-600">{selectedBranch.address}</p>
              </div>
              {isSuperAdmin() && (
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedBranch(null)}
                >
                  Cambiar Sede
                </Button>
              )}
            </div>
          </div>
        )}

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

        {/* Management Modules for admin roles */}
        {(isSuperAdmin() || isAdmin()) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Estudiantes</h3>
                <p className="text-sm text-gray-600 mb-4">Gestión de estudiantes</p>
                <Link to="/students">
                  <Button className="w-full">Gestionar</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">Cursos</h3>
                <p className="text-sm text-gray-600 mb-4">Gestión de cursos</p>
                <Link to="/courses">
                  <Button className="w-full" variant="default">Gestionar</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <h3 className="font-semibold">Inscripciones</h3>
                <p className="text-sm text-gray-600 mb-4">Gestión de inscripciones</p>
                <Link to="/enrollments">
                  <Button className="w-full" variant="default">Gestionar</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold">Pagos</h3>
                <p className="text-sm text-gray-600 mb-4">Gestión de pagos</p>
                <Link to="/payments">
                  <Button className="w-full" variant="default">Gestionar</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

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
