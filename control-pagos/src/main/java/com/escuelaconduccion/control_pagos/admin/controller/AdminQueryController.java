package com.escuelaconduccion.control_pagos.admin.controller;

import com.escuelaconduccion.control_pagos.admin.dto.CourseFinancialSummaryDTO;
import com.escuelaconduccion.control_pagos.admin.dto.EnrollmentFinancialStatusDTO;
import com.escuelaconduccion.control_pagos.admin.dto.StudentDebtDTO;
import com.escuelaconduccion.control_pagos.admin.service.AdminQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminQueryController {

    private final AdminQueryService adminQueryService;

    @GetMapping("/enrollments/{id}/financial-status")
    public EnrollmentFinancialStatusDTO getEnrollmentFinancialStatus(
            @PathVariable Long id) {

        return adminQueryService.getFinancialStatus(id);
    }

    @GetMapping("/students/with-debt")
    public List<StudentDebtDTO> getStudentsWithDebt() {
        return adminQueryService.getStudentsWithDebt();
    }

    @GetMapping("/courses/{id}/summary")
    public CourseFinancialSummaryDTO getCourseSummary(@PathVariable Long id) {
        return adminQueryService.getCourseSummary(id);
    }

}
