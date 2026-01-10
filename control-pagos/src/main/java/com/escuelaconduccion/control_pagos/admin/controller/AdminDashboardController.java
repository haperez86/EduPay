package com.escuelaconduccion.control_pagos.admin.controller;

import com.escuelaconduccion.control_pagos.admin.dto.DashboardDTO;
import com.escuelaconduccion.control_pagos.admin.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    @GetMapping("/dashboard")
    public DashboardDTO getDashboard() {
        return dashboardService.getDashboard();
    }
}
