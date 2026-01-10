package com.escuelaconduccion.control_pagos.admin.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class EnrollmentFinancialStatusDTO {

    private Long enrollmentId;

    private String studentName;
    private String courseName;

    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal balance;

    private Boolean active;
}