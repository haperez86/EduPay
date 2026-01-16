package com.escuelaconduccion.control_pagos.admin.service;

import com.escuelaconduccion.control_pagos.admin.dto.CourseFinancialSummaryDTO;
import com.escuelaconduccion.control_pagos.admin.dto.EnrollmentFinancialStatusDTO;
import com.escuelaconduccion.control_pagos.admin.dto.StudentDebtDTO;
import com.escuelaconduccion.control_pagos.auth.model.User;
import com.escuelaconduccion.control_pagos.auth.repository.UserRepository;
import com.escuelaconduccion.control_pagos.enrollment.model.Enrollment;
import com.escuelaconduccion.control_pagos.enrollment.repository.EnrollmentRepository;
import com.escuelaconduccion.control_pagos.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminQueryService {

    private final EnrollmentRepository enrollmentRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<StudentDebtDTO> getStudentsWithDebt() {
        // Obtener usuario autenticado
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User currentUser = userRepository.findByUsernameAndActiveTrueWithBranch(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        System.out.println("=== DEBUG AdminQueryService.getStudentsWithDebt ===");
        System.out.println("Usuario: " + currentUser.getUsername());
        System.out.println("Rol: " + currentUser.getRole());
        System.out.println("BranchId Usuario: " + (currentUser.getBranch() != null ? currentUser.getBranch().getId() : "null"));
        
        List<StudentDebtDTO> students;
        
        if (currentUser.getRole().equals("SUPER_ADMIN")) {
            // SUPER_ADMIN ve todos los estudiantes con deuda
            students = enrollmentRepository.findStudentsWithDebt();
            System.out.println("SUPER_ADMIN detectado, mostrando todos los estudiantes con deuda: " + students.size());
        } else {
            // ADMIN solo ve estudiantes con deuda de su sede
            Long filterBranchId = currentUser.getBranch() != null ? currentUser.getBranch().getId() : null;
            if (filterBranchId != null) {
                students = enrollmentRepository.findStudentsWithDebtByBranch(filterBranchId);
                System.out.println("ADMIN detectado, mostrando estudiantes con deuda de sede " + filterBranchId + ": " + students.size());
            } else {
                students = List.of(); // Usuario sin sede asignada
                System.out.println("ADMIN sin sede asignada, devolviendo lista vacía");
            }
        }
        
        System.out.println("Total estudiantes con deuda a devolver: " + students.size());
        System.out.println("=== FIN DEBUG AdminQueryService.getStudentsWithDebt ===");
        
        return students;
    }

    @Transactional(readOnly = true)
    public List<StudentDebtDTO> getStudentsWithDebtByBranch(Long branchId) {
        // Para SUPER_ADMIN que quiere ver estudiantes con deuda de una sede específica
        System.out.println("=== DEBUG AdminQueryService.getStudentsWithDebtByBranch ===");
        System.out.println("Solicitando estudiantes con deuda para branchId: " + branchId);
        
        List<StudentDebtDTO> students = enrollmentRepository.findStudentsWithDebtByBranch(branchId);
        
        System.out.println("Estudiantes con deuda por sede: " + students.size());
        System.out.println("=== FIN DEBUG AdminQueryService.getStudentsWithDebtByBranch ===");
        
        return students;
    }

    public EnrollmentFinancialStatusDTO getFinancialStatus(Long enrollmentId) {

        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        BigDecimal paidAmount =
                paymentRepository.sumConfirmedPaymentsByEnrollment(enrollmentId);

        BigDecimal balance =
                enrollment.getTotalAmount().subtract(paidAmount);

        return EnrollmentFinancialStatusDTO.builder()
                .enrollmentId(enrollment.getId())
                .studentName(enrollment.getStudent().getFullName())
                .courseName(enrollment.getCourse().getName())
                .totalAmount(enrollment.getTotalAmount())
                .paidAmount(paidAmount)
                .balance(balance)
                .active(enrollment.getActive())
                .build();
    }

    public CourseFinancialSummaryDTO getCourseSummary(Long courseId) {

        CourseFinancialSummaryDTO summary =
                enrollmentRepository.getCourseFinancialSummary(courseId);

        if (summary == null) {
            throw new IllegalArgumentException("El curso no tiene matrículas asociadas");
        }

        return summary;
    }
}
