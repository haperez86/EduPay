package com.escuelaconduccion.control_pagos.payment.dto;

import com.escuelaconduccion.control_pagos.payment.model.PaymentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRequestDTO {

    @NotNull
    private Long enrollmentId;

    @NotNull
    @Positive
    private BigDecimal amount;

    @NotNull
    private PaymentType type;

    private Long paymentMethodId; // ID del método de pago
}