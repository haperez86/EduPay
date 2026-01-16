package com.escuelaconduccion.control_pagos.payment.repository;

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
}