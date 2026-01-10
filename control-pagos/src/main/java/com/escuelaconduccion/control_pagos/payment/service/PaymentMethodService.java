package com.escuelaconduccion.control_pagos.payment.service;

import com.escuelaconduccion.control_pagos.payment.dto.PaymentMethodRequestDTO;
import com.escuelaconduccion.control_pagos.payment.dto.PaymentMethodResponseDTO;
import com.escuelaconduccion.control_pagos.payment.model.PaymentMethod;
import com.escuelaconduccion.control_pagos.payment.repository.PaymentMethodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentMethodService {

    private final PaymentMethodRepository repository;

    public PaymentMethodResponseDTO create(PaymentMethodRequestDTO request) {
        PaymentMethod method = PaymentMethod.builder()
                .name(request.getName())
                .build();
        repository.save(method);

        return PaymentMethodResponseDTO.builder()
                .id(method.getId())
                .name(method.getName())
                .build();
    }

    public List<PaymentMethodResponseDTO> getAll() {
        return repository.findAll().stream()
                .map(m -> PaymentMethodResponseDTO.builder()
                        .id(m.getId())
                        .name(m.getName())
                        .build())
                .toList();
    }
}
