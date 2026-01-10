package com.escuelaconduccion.control_pagos.admin.service;

import com.escuelaconduccion.control_pagos.admin.dto.CourseFinancialSummaryDTO;
import com.escuelaconduccion.control_pagos.admin.dto.EnrollmentFinancialStatusDTO;
import com.escuelaconduccion.control_pagos.admin.dto.StudentDebtDTO;
import com.escuelaconduccion.control_pagos.enrollment.model.Enrollment;
import com.escuelaconduccion.control_pagos.enrollment.repository.EnrollmentRepository;
import com.escuelaconduccion.control_pagos.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
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

    @Transactional(readOnly = true)
    public List<StudentDebtDTO> getStudentsWithDebt() {
        return enrollmentRepository.findStudentsWithDebt();
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
