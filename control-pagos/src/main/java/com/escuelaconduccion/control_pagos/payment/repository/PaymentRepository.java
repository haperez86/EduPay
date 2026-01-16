package com.escuelaconduccion.control_pagos.payment.repository;

import com.escuelaconduccion.control_pagos.payment.dto.MonthlyIncomeDTO;
import com.escuelaconduccion.control_pagos.payment.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    // 1️⃣ Para listados / histórico
    @Query("""
        SELECT p FROM Payment p
        JOIN FETCH p.paymentMethod
        WHERE p.enrollment.id = :enrollmentId
    """)
    List<Payment> findByEnrollmentIdWithMethod(
            @Param("enrollmentId") Long enrollmentId
    );

    // 2️⃣ Para cálculos financieros (CORE)
    @Query("""
        SELECT COALESCE(SUM(p.amount), 0)
        FROM Payment p
        WHERE p.enrollment.id = :enrollmentId
        AND p.status = com.escuelaconduccion.control_pagos.payment.model.PaymentStatus.CONFIRMADO
    """)
    BigDecimal sumConfirmedPaymentsByEnrollment(
            @Param("enrollmentId") Long enrollmentId
    );

    @Query("SELECT p FROM Payment p JOIN FETCH p.paymentMethod JOIN FETCH p.enrollment")
    List<Payment> findAllWithMethod();

    // Métodos para filtrar por sede
    @Query("SELECT p FROM Payment p JOIN FETCH p.paymentMethod JOIN FETCH p.enrollment JOIN FETCH p.branch WHERE p.branch.id = :branchId")
    List<Payment> findByBranchIdWithBranch(Long branchId);

    @Query("SELECT p FROM Payment p JOIN FETCH p.paymentMethod JOIN FETCH p.enrollment JOIN FETCH p.branch ORDER BY p.paymentDate DESC")
    List<Payment> findAllWithBranch();

    // Reportes mensuales de ingresos - Compatible con PostgreSQL
    @Query(value = """
        SELECT 
            CASE 
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 1 THEN 'Enero'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 2 THEN 'Febrero'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 3 THEN 'Marzo'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 4 THEN 'Abril'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 5 THEN 'Mayo'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 6 THEN 'Junio'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 7 THEN 'Julio'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 8 THEN 'Agosto'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 9 THEN 'Septiembre'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 10 THEN 'Octubre'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 11 THEN 'Noviembre'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 12 THEN 'Diciembre'
            END as month,
            EXTRACT(YEAR FROM e.enrollment_date) as year,
            EXTRACT(MONTH FROM e.enrollment_date) as monthNumber,
            COALESCE(SUM(p.amount), 0) as totalIncome,
            COUNT(p.id) as paymentCount,
            b.id as branchId,
            b.name as branchName,
            COALESCE(SUM(e.total_amount), 0) as totalSales,
            COALESCE(SUM(e.paid_amount), 0) as totalPaid,
            COALESCE(SUM(e.total_amount - e.paid_amount), 0) as totalPending
        FROM enrollments e
        LEFT JOIN payments p ON e.id = p.enrollment_id AND p.status = 'CONFIRMADO'
        JOIN branches b ON e.branch_id = b.id
        WHERE (:branchId IS NULL OR b.id = :branchId)
        AND (:year IS NULL OR EXTRACT(YEAR FROM e.enrollment_date) = :year)
        GROUP BY EXTRACT(YEAR FROM e.enrollment_date), EXTRACT(MONTH FROM e.enrollment_date), b.id, b.name
        ORDER BY EXTRACT(YEAR FROM e.enrollment_date) DESC, EXTRACT(MONTH FROM e.enrollment_date) DESC
        """, nativeQuery = true)
    List<Object[]> getMonthlyIncomeByBranchNative(
        @Param("branchId") Long branchId,
        @Param("year") Integer year
    );

    @Query(value = """
        SELECT 
            CASE 
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 1 THEN 'Enero'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 2 THEN 'Febrero'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 3 THEN 'Marzo'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 4 THEN 'Abril'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 5 THEN 'Mayo'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 6 THEN 'Junio'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 7 THEN 'Julio'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 8 THEN 'Agosto'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 9 THEN 'Septiembre'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 10 THEN 'Octubre'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 11 THEN 'Noviembre'
                WHEN EXTRACT(MONTH FROM e.enrollment_date) = 12 THEN 'Diciembre'
            END as month,
            EXTRACT(YEAR FROM e.enrollment_date) as year,
            EXTRACT(MONTH FROM e.enrollment_date) as monthNumber,
            COALESCE(SUM(p.amount), 0) as totalIncome,
            COUNT(p.id) as paymentCount,
            b.id as branchId,
            b.name as branchName,
            COALESCE(SUM(e.total_amount), 0) as totalSales,
            COALESCE(SUM(e.paid_amount), 0) as totalPaid,
            COALESCE(SUM(e.total_amount - e.paid_amount), 0) as totalPending
        FROM enrollments e
        LEFT JOIN payments p ON e.id = p.enrollment_id AND p.status = 'CONFIRMADO'
        JOIN branches b ON e.branch_id = b.id
        WHERE (:year IS NULL OR EXTRACT(YEAR FROM e.enrollment_date) = :year)
        GROUP BY EXTRACT(YEAR FROM e.enrollment_date), EXTRACT(MONTH FROM e.enrollment_date), b.id, b.name
        ORDER BY EXTRACT(YEAR FROM e.enrollment_date) DESC, EXTRACT(MONTH FROM e.enrollment_date) DESC
        """, nativeQuery = true)
    List<Object[]> getAllMonthlyIncomeNative(
        @Param("year") Integer year
    );
}