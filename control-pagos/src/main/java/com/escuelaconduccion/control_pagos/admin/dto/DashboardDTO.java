package com.escuelaconduccion.control_pagos.admin.dto;

import java.math.BigDecimal;

public record DashboardDTO(
        Long totalStudents,
        Long totalEnrollments,
        BigDecimal totalFacturado,
        BigDecimal totalCobrado,
        BigDecimal totalAdeudado
) {}
