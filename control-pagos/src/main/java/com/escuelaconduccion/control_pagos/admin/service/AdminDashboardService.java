package com.escuelaconduccion.control_pagos.admin.service;

import com.escuelaconduccion.control_pagos.admin.dto.DashboardDTO;
import com.escuelaconduccion.control_pagos.auth.model.User;
import com.escuelaconduccion.control_pagos.auth.repository.UserRepository;
import com.escuelaconduccion.control_pagos.enrollment.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public DashboardDTO getDashboard() {
        // Obtener usuario autenticado
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User currentUser = userRepository.findByUsernameAndActiveTrueWithBranch(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        System.out.println("=== DEBUG AdminDashboardService.getDashboard ===");
        System.out.println("Usuario: " + currentUser.getUsername());
        System.out.println("Rol: " + currentUser.getRole());
        System.out.println("BranchId Usuario: " + (currentUser.getBranch() != null ? currentUser.getBranch().getId() : "null"));
        
        DashboardDTO dashboard;
        
        if (currentUser.getRole().equals("SUPER_ADMIN")) {
            // SUPER_ADMIN ve todos los datos (por defecto, sin filtro)
            dashboard = enrollmentRepository.getDashboardData();
            System.out.println("SUPER_ADMIN detectado, mostrando dashboard global");
        } else {
            // ADMIN solo ve datos de su sede
            Long filterBranchId = currentUser.getBranch() != null ? currentUser.getBranch().getId() : null;
            if (filterBranchId != null) {
                dashboard = enrollmentRepository.getDashboardDataByBranch(filterBranchId);
                System.out.println("ADMIN detectado, mostrando dashboard de sede " + filterBranchId);
            } else {
                // Usuario sin sede asignada - dashboard vacío
                dashboard = new DashboardDTO(0L, 0L, java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO);
                System.out.println("ADMIN sin sede asignada, mostrando dashboard vacío");
            }
        }
        
        System.out.println("Dashboard - Estudiantes: " + dashboard.totalStudents() + 
                         ", Inscripciones: " + dashboard.totalEnrollments() +
                         ", Facturado: " + dashboard.totalFacturado());
        System.out.println("=== FIN DEBUG AdminDashboardService.getDashboard ===");
        
        return dashboard;
    }

    public DashboardDTO getDashboardByBranch(Long branchId) {
        // Para SUPER_ADMIN que quiere ver datos de una sede específica
        System.out.println("=== DEBUG AdminDashboardService.getDashboardByBranch ===");
        System.out.println("Solicitando dashboard para branchId: " + branchId);
        
        DashboardDTO dashboard = enrollmentRepository.getDashboardDataByBranch(branchId);
        
        System.out.println("Dashboard por sede - Estudiantes: " + dashboard.totalStudents() + 
                         ", Inscripciones: " + dashboard.totalEnrollments() +
                         ", Facturado: " + dashboard.totalFacturado());
        System.out.println("=== FIN DEBUG AdminDashboardService.getDashboardByBranch ===");
        
        return dashboard;
    }
}
