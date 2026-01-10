package com.escuelaconduccion.control_pagos.admin.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CourseFinancialSummaryDTO {

    private Long courseId;
    private String courseName;

    private BigDecimal totalFacturado;
    private BigDecimal totalCobrado;
    private BigDecimal totalAdeudado;

    private Long totalEnrollments;
    private Boolean active;
}
