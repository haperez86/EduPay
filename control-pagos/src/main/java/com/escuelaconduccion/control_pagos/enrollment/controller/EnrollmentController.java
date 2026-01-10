package com.escuelaconduccion.control_pagos.enrollment.controller;

import com.escuelaconduccion.control_pagos.enrollment.dto.EnrollmentRequestDTO;
import com.escuelaconduccion.control_pagos.enrollment.dto.EnrollmentResponseDTO;
import com.escuelaconduccion.control_pagos.enrollment.dto.EnrollmentSummaryDTO;
import com.escuelaconduccion.control_pagos.enrollment.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    public EnrollmentResponseDTO createEnrollment(
            @Valid @RequestBody EnrollmentRequestDTO request
    ) {
        return enrollmentService.createEnrollment(request);
    }

    @GetMapping
    public List<EnrollmentResponseDTO> getAllEnrollments() {
        return enrollmentService.getAllEnrollments();
    }

    @GetMapping("/{id}")
    public EnrollmentResponseDTO getEnrollmentById(@PathVariable Long id) {
        return enrollmentService.getEnrollmentById(id);
    }

    @GetMapping("/{id}/summary")
    public EnrollmentSummaryDTO getEnrollmentSummary(@PathVariable Long id) {
        return enrollmentService.getEnrollmentSummary(id);
    }
}
