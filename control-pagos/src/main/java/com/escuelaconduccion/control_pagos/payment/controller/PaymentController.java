package com.escuelaconduccion.control_pagos.payment.controller;

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
        return paymentService.registerPayment(request);
    }

    @GetMapping
    public List<PaymentResponseDTO> getAllPayments() {
        return paymentService.getAllPayments();
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
}
