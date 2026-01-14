package com.escuelaconduccion.control_pagos.payment.model;

import com.escuelaconduccion.control_pagos.branch.model.Branch;
import com.escuelaconduccion.control_pagos.enrollment.model.Enrollment;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
      updatedAt = LocalDateTime.now();
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private Enrollment enrollment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDateTime paymentDate;

    @Enumerated(EnumType.STRING)
    @Column
    private PaymentType type;

    @Enumerated(EnumType.STRING)
    @Column
    private PaymentStatus status;

    @Column(length = 100)
    private String transactionReference;

    @Column(length = 500)
    private String notes;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "payment_method_id", nullable = false)
    private PaymentMethod paymentMethod;
}