package com.escuelaconduccion.control_pagos.admin.service;

import com.escuelaconduccion.control_pagos.admin.dto.DashboardDTO;
import com.escuelaconduccion.control_pagos.enrollment.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final EnrollmentRepository enrollmentRepository;

    public DashboardDTO getDashboard() {
        return enrollmentRepository.getDashboardData();
    }
}
