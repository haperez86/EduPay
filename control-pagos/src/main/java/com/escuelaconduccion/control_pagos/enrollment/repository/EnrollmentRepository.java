package com.escuelaconduccion.control_pagos.enrollment.repository;

import com.escuelaconduccion.control_pagos.admin.dto.CourseFinancialSummaryDTO;
import com.escuelaconduccion.control_pagos.admin.dto.DashboardDTO;
import com.escuelaconduccion.control_pagos.enrollment.model.Enrollment;
import com.escuelaconduccion.control_pagos.admin.dto.StudentDebtDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    @Query("""
        SELECT new com.escuelaconduccion.control_pagos.admin.dto.StudentDebtDTO(
            s.id,
            CONCAT(s.firstName, ' ', s.lastName),
            SUM(e.totalAmount - e.paidAmount)
        )
        FROM Enrollment e
        JOIN e.student s
        WHERE e.active = true
        AND (e.totalAmount - e.paidAmount) > 0
        GROUP BY s.id, s.firstName, s.lastName
        """)
        List<StudentDebtDTO> findStudentsWithDebt();

    @Query("""
        SELECT new com.escuelaconduccion.control_pagos.admin.dto.StudentDebtDTO(
            s.id,
            CONCAT(s.firstName, ' ', s.lastName),
            SUM(e.totalAmount - e.paidAmount)
        )
        FROM Enrollment e
        JOIN e.student s
        WHERE e.active = true
        AND (e.totalAmount - e.paidAmount) > 0
        AND s.branch.id = :branchId
        GROUP BY s.id, s.firstName, s.lastName
        """)
        List<StudentDebtDTO> findStudentsWithDebtByBranch(@Param("branchId") Long branchId);

    @Query("""
        SELECT new com.escuelaconduccion.control_pagos.admin.dto.CourseFinancialSummaryDTO(
            c.id,
            c.name,
            SUM(e.totalAmount),
            SUM(e.paidAmount),
            SUM(e.totalAmount - e.paidAmount),
            COUNT(e.id),
            c.active
        )
        FROM Enrollment e
        JOIN e.course c
        WHERE c.id = :courseId
        GROUP BY c.id, c.name, c.active
        """)
            CourseFinancialSummaryDTO getCourseFinancialSummary(@Param("courseId") Long courseId);

    @Query("""
    SELECT new com.escuelaconduccion.control_pagos.admin.dto.DashboardDTO(
        (SELECT COUNT(s) FROM Student s WHERE s.active = true),
        COUNT(e),
        COALESCE(SUM(e.totalAmount), 0),
        COALESCE(SUM(e.paidAmount), 0),
        COALESCE(SUM(e.totalAmount - e.paidAmount), 0)
    )
    FROM Enrollment e
    WHERE e.active = true
    """)
    DashboardDTO getDashboardData();

    @Query("""
    SELECT new com.escuelaconduccion.control_pagos.admin.dto.DashboardDTO(
        (SELECT COUNT(s) FROM Student s WHERE s.active = true AND s.branch.id = :branchId),
        COUNT(e),
        COALESCE(SUM(e.totalAmount), 0),
        COALESCE(SUM(e.paidAmount), 0),
        COALESCE(SUM(e.totalAmount - e.paidAmount), 0)
    )
    FROM Enrollment e
    WHERE e.active = true
    AND e.branch.id = :branchId
    """)
    DashboardDTO getDashboardDataByBranch(@Param("branchId") Long branchId);

    // Métodos para filtrar por sede
    @Query("SELECT e FROM Enrollment e LEFT JOIN FETCH e.student LEFT JOIN FETCH e.course LEFT JOIN FETCH e.branch WHERE e.branch.id = :branchId")
    List<Enrollment> findByBranchIdWithBranch(Long branchId);

    @Query("SELECT e FROM Enrollment e LEFT JOIN FETCH e.student LEFT JOIN FETCH e.course LEFT JOIN FETCH e.branch ORDER BY e.enrollmentDate DESC")
    List<Enrollment> findAllWithBranch();

    // Método adicional para inscripciones sin sede
    @Query("SELECT e FROM Enrollment e LEFT JOIN FETCH e.student LEFT JOIN FETCH e.course LEFT JOIN FETCH e.branch WHERE e.branch.id IS NULL")
    List<Enrollment> findByBranchIdNull();
}