package com.escuelaconduccion.control_pagos.admin.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StudentDebtDTO {

    private Long studentId;
    private String studentName;
    private BigDecimal totalDebt;
}