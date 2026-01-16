package com.escuelaconduccion.control_pagos.payment.service;

import com.escuelaconduccion.control_pagos.enrollment.model.Enrollment;
import com.escuelaconduccion.control_pagos.enrollment.repository.EnrollmentRepository;
import com.escuelaconduccion.control_pagos.payment.dto.MonthlyIncomeDTO;
import com.escuelaconduccion.control_pagos.payment.dto.PaymentRequestDTO;
import com.escuelaconduccion.control_pagos.payment.dto.PaymentResponseDTO;
import com.escuelaconduccion.control_pagos.payment.model.Payment;
import com.escuelaconduccion.control_pagos.payment.model.PaymentMethod;
import com.escuelaconduccion.control_pagos.payment.model.PaymentStatus;
import com.escuelaconduccion.control_pagos.payment.model.PaymentType;
import com.escuelaconduccion.control_pagos.payment.repository.PaymentMethodRepository;
import com.escuelaconduccion.control_pagos.payment.repository.PaymentRepository;
import com.escuelaconduccion.control_pagos.auth.model.User;
import com.escuelaconduccion.control_pagos.auth.repository.UserRepository;
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

        // Para PAGO_TOTAL, el monto final es siempre el saldo restante
        // Para ABONO, se usa el monto solicitado (que ya fue validado)
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

    // 📊 Reportes mensuales de ingresos - Corregido para PostgreSQL
    @Transactional(readOnly = true)
    public List<MonthlyIncomeDTO> getMonthlyIncomeReport(Integer year, Long branchId) {
        // Obtener usuario autenticado
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User currentUser = userRepository.findByUsernameAndActiveTrueWithBranch(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        System.out.println("=== DEBUG PaymentService.getMonthlyIncomeReport ===");
        System.out.println("Usuario: " + currentUser.getUsername());
        System.out.println("Rol: " + currentUser.getRole());
        System.out.println("Año solicitado: " + year);
        System.out.println("BranchId solicitado: " + branchId);

        List<Object[]> rawData;

        if (currentUser.getRole().equals("SUPER_ADMIN")) {
            // SUPER_ADMIN puede ver todos los datos o filtrar por sede específica
            if (branchId != null) {
                rawData = paymentRepository.getMonthlyIncomeByBranchNative(branchId, year);
                System.out.println("SUPER_ADMIN - Reporte por sede: " + branchId);
            } else {
                rawData = paymentRepository.getAllMonthlyIncomeNative(year);
                System.out.println("SUPER_ADMIN - Reporte de todas las sedes");
            }
        } else {
            // ADMIN solo ve datos de su sede
            Long userBranchId = currentUser.getBranch() != null ? currentUser.getBranch().getId() : null;
            if (userBranchId != null) {
                rawData = paymentRepository.getMonthlyIncomeByBranchNative(userBranchId, year);
                System.out.println("ADMIN - Reporte de su sede: " + userBranchId);
            } else {
                rawData = new ArrayList<>();
                System.out.println("ADMIN sin sede - Lista vacía");
            }
        }

        // Convertir Object[] a MonthlyIncomeDTO manualmente - CORREGIDO PARA POSTGRESQL
        List<MonthlyIncomeDTO> report = rawData.stream().map(row ->
                MonthlyIncomeDTO.builder()
                        .month((String) row[0])           // "Enero", "Febrero", etc.
                        .year(((Number) row[1]).intValue()) // PostgreSQL retorna BigDecimal, convertir a Integer
                        .monthNumber(((Number) row[2]).intValue()) // PostgreSQL retorna BigDecimal, convertir a Integer
                        .totalIncome((BigDecimal) row[3]) // 1500000.00
                        .paymentCount(((Number) row[4]).longValue()) // PostgreSQL retorna BigDecimal, convertir a Long
                        .branchId(row[5] != null ? ((Number) row[5]).longValue() : null) // 1, 2, 3...
                        .branchName((String) row[6])      // "Duitama", "Sogamoso"
                        .totalSales((BigDecimal) row[7])   // Ventas totales
                        .totalPaid((BigDecimal) row[8])    // Abonos totales
                        .totalPending((BigDecimal) row[9]) // Pendientes totales
                        .build()
        ).toList();

        System.out.println("Registros encontrados: " + report.size());
        System.out.println("=== FIN DEBUG PaymentService.getMonthlyIncomeReport ===");

        return report;
    }
}
