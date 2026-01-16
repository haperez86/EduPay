package com.escuelaconduccion.control_pagos.payment.controller;

import com.escuelaconduccion.control_pagos.payment.dto.MonthlyIncomeDTO;
import com.escuelaconduccion.control_pagos.payment.dto.PaymentRequestDTO;
import com.escuelaconduccion.control_pagos.payment.dto.PaymentResponseDTO;
import com.escuelaconduccion.control_pagos.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public PaymentResponseDTO registerPayment(@Valid @RequestBody PaymentRequestDTO request) {
        System.out.println("=== DEBUG PaymentController.registerPayment ===");
        System.out.println("EnrollmentId: " + request.getEnrollmentId());
        System.out.println("Amount: " + request.getAmount());
        System.out.println("PaymentMethodId: " + request.getPaymentMethodId());
        System.out.println("Type: " + request.getType());
        System.out.println("=== INICIANDO REGISTRO DE PAGO ===");
        
        PaymentResponseDTO response = paymentService.registerPayment(request);
        
        System.out.println("Pago registrado exitosamente - ID: " + response.getId());
        System.out.println("=== FIN DEBUG PaymentController.registerPayment ===");
        
        return response;
    }

    @GetMapping
    public List<PaymentResponseDTO> getAllPayments(
            @RequestParam(required = false) Long branchId  // Solo para SUPER_ADMIN
    ) {
        return paymentService.getAllPayments(branchId);
    }

    @GetMapping("/enrollment/{enrollmentId}")
    public List<PaymentResponseDTO> getPaymentsByEnrollment(@PathVariable Long enrollmentId) {
        return paymentService.getPaymentsByEnrollment(enrollmentId);
    }

    @DeleteMapping("/{paymentId}")
    public ResponseEntity<Map<String, String>> cancelPayment(@PathVariable Long paymentId) {
        paymentService.cancelPayment(paymentId);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Pago anulado correctamente");
        
        return ResponseEntity.ok(response);
    }

    // 📊 Endpoint para reportes mensuales de ingresos
    @GetMapping("/monthly-income")
    public List<MonthlyIncomeDTO> getMonthlyIncomeReport(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Long branchId  // Solo para SUPER_ADMIN
    ) {
        // Si no se especifica año, usar el año actual
        if (year == null) {
            year = java.time.Year.now().getValue();
        }
        
        return paymentService.getMonthlyIncomeReport(year, branchId);
    }
}
