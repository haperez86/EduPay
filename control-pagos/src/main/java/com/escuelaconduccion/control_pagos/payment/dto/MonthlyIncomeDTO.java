package com.escuelaconduccion.control_pagos.payment.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
public class MonthlyIncomeDTO {
    
    private String month;
    private Integer year;
    private Integer monthNumber;
    private BigDecimal totalIncome;
    private Long paymentCount;
    private Long branchId;
    private String branchName;
    
    // Nuevos campos para el reporte mejorado
    private BigDecimal totalSales;        // Ventas totales (totalAmount de inscripciones)
    private BigDecimal totalPaid;         // Abonos totales (paidAmount de inscripciones)
    private BigDecimal totalPending;      // Pendientes totales (totalAmount - paidAmount)
    
    // Constructor específico para JPA con los tipos exactos de la consulta
    public MonthlyIncomeDTO(String month, Integer year, Integer monthNumber, 
                           BigDecimal totalIncome, Long paymentCount, 
                           Long branchId, String branchName) {
        this.month = month;
        this.year = year;
        this.monthNumber = monthNumber;
        this.totalIncome = totalIncome;
        this.paymentCount = paymentCount;
        this.branchId = branchId;
        this.branchName = branchName;
    }
    
    // Constructor completo para el nuevo reporte
    public MonthlyIncomeDTO(String month, Integer year, Integer monthNumber, 
                           BigDecimal totalIncome, Long paymentCount, 
                           Long branchId, String branchName,
                           BigDecimal totalSales, BigDecimal totalPaid, BigDecimal totalPending) {
        this.month = month;
        this.year = year;
        this.monthNumber = monthNumber;
        this.totalIncome = totalIncome;
        this.paymentCount = paymentCount;
        this.branchId = branchId;
        this.branchName = branchName;
        this.totalSales = totalSales;
        this.totalPaid = totalPaid;
        this.totalPending = totalPending;
    }
}
