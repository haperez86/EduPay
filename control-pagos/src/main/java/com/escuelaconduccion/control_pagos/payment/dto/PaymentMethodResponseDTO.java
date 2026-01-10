package com.escuelaconduccion.control_pagos.payment.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentMethodResponseDTO {
    private Long id;
    private String name;
}