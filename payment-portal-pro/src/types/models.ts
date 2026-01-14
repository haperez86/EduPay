export interface Branch {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  isMain: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id?: number;
  username: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STUDENT';
  branch?: Branch;
  branchId?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  documentNumber: string;
  email: string;
  phone: string;
  active: boolean;
}

export interface Course {
  id: number;
  name: string;
  description: string;
  price: number;
  totalHours: number;
  active: boolean;
}

export interface Enrollment {
  id: number;
  studentId: number;
  courseId: number;
  student?: Student;
  course?: Course;
  enrollmentDate: string;
  totalAmount: number;
  paidAmount: number;
  active: boolean;
  studentName?: string;
  studentDocument?: string;
  studentEmail?: string;
}

export interface Payment {
  id: number;
  enrollmentId: number;
  enrollment?: Enrollment;
  amount: number;
  paymentDate: string;
  type: 'ABONO' | 'PAGO_TOTAL';
  status: 'CONFIRMADO' | 'ANULADO';
  paymentMethodId: number;
  paymentMethodName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role?: string;
  branchId?: number;
}

export interface FinancialStatus {
  enrollmentId: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentPercentage: number;
}

export interface CourseSummary {
  courseId: number;
  courseName: string;
  totalEnrollments: number;
  totalRevenue: number;
  totalPending: number;
}

export interface StudentWithDebt {
  student: Student;
  totalDebt: number;
  enrollments: Enrollment[];
}

export type CreateStudentDTO = Omit<Student, 'id' | 'active'>;
export type CreateCourseDTO = Omit<Course, 'id' | 'active'>;
export type CreateEnrollmentDTO = Pick<Enrollment, 'studentId' | 'courseId'>;
export type CreatePaymentDTO = {
  enrollmentId: number;
  amount: number;
  paymentMethodId: number;  // Cambia de paymentMethod a paymentMethodId
  type: 'ABONO' | 'PAGO_TOTAL';
};
