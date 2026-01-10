package com.escuelaconduccion.control_pagos.enrollment.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollmentResponseDTO {

    private Long id;
    private Long studentId;
    private Long courseId;
    private LocalDate enrollmentDate;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private Boolean active;
    private String studentName; 
    private String studentDocument;
    private String studentEmail;
    private String courseName;
}