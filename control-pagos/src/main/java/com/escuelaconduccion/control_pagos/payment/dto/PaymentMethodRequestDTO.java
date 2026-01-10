package com.escuelaconduccion.control_pagos.payment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodRequestDTO {

    @NotBlank
    private String name;
}
