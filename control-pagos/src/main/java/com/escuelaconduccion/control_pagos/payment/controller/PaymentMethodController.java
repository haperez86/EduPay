package com.escuelaconduccion.control_pagos.payment.controller;

import com.escuelaconduccion.control_pagos.payment.dto.PaymentMethodRequestDTO;
import com.escuelaconduccion.control_pagos.payment.dto.PaymentMethodResponseDTO;
import com.escuelaconduccion.control_pagos.payment.service.PaymentMethodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment-methods")
@RequiredArgsConstructor
public class PaymentMethodController {

    private final PaymentMethodService service;

    @PostMapping
    public PaymentMethodResponseDTO create(@Valid @RequestBody PaymentMethodRequestDTO request) {
        return service.create(request);
    }

    @GetMapping
    public List<PaymentMethodResponseDTO> getAll() {
        return service.getAll();
    }
}