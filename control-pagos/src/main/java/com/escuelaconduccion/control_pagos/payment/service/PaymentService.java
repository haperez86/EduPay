package com.escuelaconduccion.control_pagos.payment.service;

import com.escuelaconduccion.control_pagos.auth.model.User;
import com.escuelaconduccion.control_pagos.auth.repository.UserRepository;
import com.escuelaconduccion.control_pagos.enrollment.model.Enrollment;
import com.escuelaconduccion.control_pagos.enrollment.repository.EnrollmentRepository;
import com.escuelaconduccion.control_pagos.payment.dto.PaymentRequestDTO;
import com.escuelaconduccion.control_pagos.payment.dto.PaymentResponseDTO;
import com.escuelaconduccion.control_pagos.payment.model.Payment;
import com.escuelaconduccion.control_pagos.payment.model.PaymentMethod;
import com.escuelaconduccion.control_pagos.payment.model.PaymentStatus;
import com.escuelaconduccion.control_pagos.payment.model.PaymentType;
import com.escuelaconduccion.control_pagos.payment.repository.PaymentMethodRepository;
import com.escuelaconduccion.control_pagos.payment.repository.PaymentRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final UserRepository userRepository;

    @Transactional
    public PaymentResponseDTO registerPayment(PaymentRequestDTO request) {

        Enrollment enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                .orElseThrow(() -> new IllegalArgumentException("Matrícula no encontrada"));

        if (!enrollment.getActive()) {
            throw new IllegalStateException("La matrícula está inactiva");
        }

        PaymentMethod method = paymentMethodRepository.findById(request.getPaymentMethodId())
                .orElseThrow(() -> new IllegalArgumentException("Método de pago no encontrado"));

        BigDecimal remaining = enrollment.getTotalAmount()
                .subtract(enrollment.getPaidAmount());

        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El monto debe ser mayor a cero");
        }

        if (request.getType() == PaymentType.ABONO &&
                request.getAmount().compareTo(remaining) > 0) {
            throw new IllegalArgumentException("El abono excede el saldo pendiente");
        }

        BigDecimal finalAmount = request.getType() == PaymentType.PAGO_TOTAL
                ? remaining
                : request.getAmount();

        enrollment.setPaidAmount(enrollment.getPaidAmount().add(finalAmount));
        enrollmentRepository.save(enrollment);

        Payment payment = Payment.builder()
                .amount(finalAmount)
                .paymentDate(LocalDateTime.now())
                .type(request.getType())
                .status(PaymentStatus.CONFIRMADO)
                .enrollment(enrollment)
                .paymentMethod(method)
                .branch(enrollment.getBranch())
                .build();

        Payment saved = paymentRepository.save(payment);

        return PaymentResponseDTO.builder()
                .id(saved.getId())
                .amount(saved.getAmount())
                .paymentDate(saved.getPaymentDate())
                .type(saved.getType())
                .status(saved.getStatus())
                .enrollmentId(enrollment.getId())
                .paymentMethodId(method.getId())
                .paymentMethodName(method.getName())
                .build();
    }

    @Transactional(readOnly = true)
    public List<PaymentResponseDTO> getPaymentsByEnrollment(Long enrollmentId) {
        // Traer pagos con PaymentMethod ya inicializado usando JOIN FETCH
        List<Payment> payments = paymentRepository.findByEnrollmentIdWithMethod(enrollmentId);

        // Mapear a DTO
        return payments.stream()
                .map(p -> PaymentResponseDTO.builder()
                        .id(p.getId())
                        .amount(p.getAmount())
                        .paymentDate(p.getPaymentDate())
                        .status(p.getStatus())
                        .type(p.getType())
                        .enrollmentId(p.getEnrollment().getId())
                        .paymentMethodId(p.getPaymentMethod().getId())
                        .paymentMethodName(p.getPaymentMethod().getName())
                        .build())
                .toList();
    }

         @Transactional
        public void cancelPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        // VALIDACIÓN: Evita anular dos veces
        if (payment.getStatus() == PaymentStatus.ANULADO) {
                throw new IllegalStateException("Este pago ya está anulado");
        }

        Enrollment enrollment = payment.getEnrollment();
        BigDecimal newPaidAmount = enrollment.getPaidAmount().subtract(payment.getAmount());
        
        // PROTECCIÓN: Evita valores negativos
        if (newPaidAmount.compareTo(BigDecimal.ZERO) < 0) {
                newPaidAmount = BigDecimal.ZERO;
        }
        
        enrollment.setPaidAmount(newPaidAmount);
        enrollmentRepository.save(enrollment);

        payment.setStatus(PaymentStatus.ANULADO);
        paymentRepository.save(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponseDTO> getAllPayments(Long branchId) {
        // Obtener usuario autenticado
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User currentUser = userRepository.findByUsernameAndActiveTrueWithBranch(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        System.out.println("=== DEBUG PaymentService.getAllPayments ===");
        System.out.println("Usuario: " + currentUser.getUsername());
        System.out.println("Rol: " + currentUser.getRole());
        System.out.println("BranchId Usuario: " + (currentUser.getBranch() != null ? currentUser.getBranch().getId() : "null"));
        System.out.println("BranchId Parámetro: " + branchId);
        
        List<Payment> payments;
        Long filterBranchId = null;
        
        if (currentUser.getRole().equals("SUPER_ADMIN")) {
            // SUPER_ADMIN puede ver todos los pagos o filtrar por una sede específica
            if (branchId != null) {
                filterBranchId = branchId;
                System.out.println("SUPER_ADMIN detectado, filtrando por branchId parámetro: " + filterBranchId);
            } else {
                System.out.println("SUPER_ADMIN detectado, sin filtro de sede (mostrando todos)");
            }
        } else {
            // ADMIN solo ve pagos de su sede (ignorar parámetro branchId)
            Long filterBranchIdFromUser = currentUser.getBranch() != null ? currentUser.getBranch().getId() : null;
            if (filterBranchIdFromUser != null) {
                filterBranchId = filterBranchIdFromUser;
                System.out.println("ADMIN detectado, filtrando por sede asignada: " + filterBranchId);
            } else {
                payments = new ArrayList<>(); // Usuario sin sede asignada
                System.out.println("ADMIN sin sede asignada, devolviendo lista vacía");
                System.out.println("=== FIN DEBUG PaymentService.getAllPayments ===");
                return payments.stream()
                        .map(p -> PaymentResponseDTO.builder()
                                .id(p.getId())
                                .amount(p.getAmount())
                                .paymentDate(p.getPaymentDate())
                                .status(p.getStatus())
                                .type(p.getType())
                                .enrollmentId(p.getEnrollment().getId())
                                .paymentMethodId(p.getPaymentMethod().getId())
                                .paymentMethodName(p.getPaymentMethod().getName())
                                .build())
                        .toList();
            }
        }
        
        if (filterBranchId == null) {
            // Si no hay un branchId específico (SUPER_ADMIN sin filtro), obtener todos
            payments = paymentRepository.findAllWithBranch();
            System.out.println("Pagos encontrados (todos): " + payments.size());
        } else {
            // Filtrar por sede específica
            payments = paymentRepository.findByBranchIdWithBranch(filterBranchId);
            System.out.println("Pagos encontrados por sede " + filterBranchId + ": " + payments.size());
        }
        
        System.out.println("Total pagos a devolver: " + payments.size());
        System.out.println("=== FIN DEBUG PaymentService.getAllPayments ===");
        
        return payments.stream()
                .map(p -> PaymentResponseDTO.builder()
                        .id(p.getId())
                        .amount(p.getAmount())
                        .paymentDate(p.getPaymentDate())
                        .status(p.getStatus())
                        .type(p.getType())
                        .enrollmentId(p.getEnrollment().getId())
                        .paymentMethodId(p.getPaymentMethod().getId())
                        .paymentMethodName(p.getPaymentMethod().getName())
                        .build())
                .toList();
    }
}