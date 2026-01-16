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
        <div className="p-4 sm:p-6">
          {/* Branch Info Card */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Building className="h-5 w-5" />
                <span className="truncate">{user.branch.name}</span>
              </CardTitle>
              <CardDescription className="text-sm">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {user.branch.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{user.branch.address}</span>
                  </div>
                )}
                {user.branch.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{user.branch.phone}</span>
                  </div>
                )}
                {user.branch.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{user.branch.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Estudiantes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">En tu sede</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Cursos</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">Disponibles</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Inscripciones</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats.totalEnrollments}</div>
                <p className="text-xs text-muted-foreground">Activas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Pagos</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats.totalPayments}</div>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </CardContent>
            </Card>
          </div>

          {/* Management Modules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="truncate">Estudiantes</span>
                </CardTitle>
                <CardDescription className="text-xs">Gestionar estudiantes de tu sede</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link to="/students" className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm">
                  Ver estudiantes →
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="truncate">Cursos</span>
                </CardTitle>
                <CardDescription className="text-xs">Administrar cursos disponibles</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link to="/courses" className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm">
                  Ver cursos →
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="truncate">Inscripciones</span>
                </CardTitle>
                <CardDescription className="text-xs">Gestionar inscripciones activas</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link to="/enrollments" className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm">
                  Ver inscripciones →
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="truncate">Pagos</span>
                </CardTitle>
                <CardDescription className="text-xs">Control de pagos y finanzas</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link to="/payments" className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm">
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
        <div className="p-4 sm:p-6">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Vista Global - Todas las Sedes</h1>
            <p className="text-gray-600 text-sm sm:text-base">Selecciona una sede para gestionar o ver reportes consolidados</p>
          </div>
          
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Building className="h-5 w-5" />
                  Sedes Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">4</div>
                <p className="text-xs sm:text-sm text-gray-600">Duitama, Sogamoso, Soatá, Socha</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <TrendingUp className="h-5 w-5" />
                  Reportes Consolidados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link to="/reports">
                  <Button className="w-full text-sm sm:text-base">Ver Reportes Globales</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Users className="h-5 w-5" />
                  Gestión Multi-Sede
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full text-sm sm:text-base" 
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
      
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
        {/* Branch info for non-student roles */}
        {(isSuperAdmin() || isAdmin()) && selectedBranch && (
          <div className="bg-card rounded-xl p-3 sm:p-4 border border-border">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-semibold truncate">
                  {isSuperAdmin() ? 'Gestionando:' : 'Sede:'} {selectedBranch.name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{selectedBranch.address}</p>
              </div>
              {isSuperAdmin() && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedBranch(null)}
                  className="w-full sm:w-auto"
                >
                  Cambiar Sede
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="sm:col-span-2 lg:col-span-1">
            <StatCard
              title="Estudiantes"
              value={stats.totalStudents}
              icon={Users}
              variant="primary"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <StatCard
              title="Cursos"
              value={stats.totalCourses}
              icon={BookOpen}
              variant="default"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <StatCard
              title="Inscripciones"
              value={stats.totalEnrollments}
              icon={ClipboardList}
              variant="default"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <StatCard
              title="Pagos"
              value={stats.totalPayments}
              icon={DollarSign}
              variant="success"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <StatCard
              title="Ingresos"
              value={`$${stats.totalRevenue.toLocaleString()}`}
              icon={TrendingUp}
              variant="success"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <StatCard
              title="Pendiente"
              value={`$${stats.pendingAmount.toLocaleString()}`}
              icon={AlertCircle}
              variant="warning"
            />
          </div>
        </div>

        {/* Management Modules for admin roles */}
        {(isSuperAdmin() || isAdmin()) && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6 text-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold text-sm sm:text-base">Estudiantes</h3>
                <p className="text-xs text-gray-600 mb-3 sm:mb-4">Gestión de estudiantes</p>
                <Link to="/students">
                  <Button className="w-full text-xs sm:text-sm">Gestionar</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6 text-center">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold text-sm sm:text-base">Cursos</h3>
                <p className="text-xs text-gray-600 mb-3 sm:mb-4">Gestión de cursos</p>
                <Link to="/courses">
                  <Button className="w-full text-xs sm:text-sm" variant="default">Gestionar</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6 text-center">
                <ClipboardList className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-yellow-600" />
                <h3 className="font-semibold text-sm sm:text-base">Inscripciones</h3>
                <p className="text-xs text-gray-600 mb-3 sm:mb-4">Gestión de inscripciones</p>
                <Link to="/enrollments">
                  <Button className="w-full text-xs sm:text-sm" variant="default">Gestionar</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6 text-center">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold text-sm sm:text-base">Pagos</h3>
                <p className="text-xs text-gray-600 mb-3 sm:mb-4">Gestión de pagos</p>
                <Link to="/payments">
                  <Button className="w-full text-xs sm:text-sm" variant="default">Gestionar</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tables Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Payments */}
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">
              Pagos Recientes
            </h2>
            <div className="overflow-x-auto">
              <DataTable
                columns={paymentColumns}
                data={recentPayments}
                emptyMessage="No hay pagos registrados"
              />
            </div>
          </div>

          {/* Students with Debt */}
          <div className="bg-card rounded-xl p-4 sm:p-6 border border-border">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">
              Estudiantes con Saldo Pendiente
            </h2>
            <div className="overflow-x-auto">
              <DataTable
                columns={debtColumns}
                data={studentsWithDebt}
                emptyMessage="No hay estudiantes con deuda"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
