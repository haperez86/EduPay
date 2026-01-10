package com.escuelaconduccion.control_pagos.payment.dto;

import com.escuelaconduccion.control_pagos.payment.model.PaymentStatus;
import com.escuelaconduccion.control_pagos.payment.model.PaymentType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponseDTO {

    private Long id;
    private BigDecimal amount;
    private LocalDateTime paymentDate;
    private PaymentType type;
    private PaymentStatus status;
    private Long enrollmentId;
    private Long paymentMethodId;
    private String paymentMethodName;
}
