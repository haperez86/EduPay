package com.escuelaconduccion.control_pagos.payment.repository;

import com.escuelaconduccion.control_pagos.payment.model.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {
}