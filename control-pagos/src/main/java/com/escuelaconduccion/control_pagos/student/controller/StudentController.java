package com.escuelaconduccion.control_pagos.student.controller;

import com.escuelaconduccion.control_pagos.student.dto.StudentListDTO;
import com.escuelaconduccion.control_pagos.student.dto.StudentRequestDTO;
import com.escuelaconduccion.control_pagos.student.dto.StudentResponseDTO;
import com.escuelaconduccion.control_pagos.student.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public StudentResponseDTO create(@RequestBody StudentRequestDTO request, Authentication authentication) {
        return studentService.create(request, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public List<StudentListDTO> getStudents(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String document,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long branchId,  // Solo para SUPER_ADMIN
            Authentication authentication
    ) {
        return studentService.getStudents(active, document, name, branchId, authentication);
    }

    @GetMapping("/public")
    public List<StudentListDTO> getPublicStudents(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String document
    ) {
        return studentService.getPublicStudents(branchId, document);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public StudentResponseDTO getStudent(@PathVariable Long id, Authentication authentication) {
        return studentService.getStudent(id, authentication);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public StudentResponseDTO updateStudent(
            @PathVariable Long id,
            @RequestBody StudentRequestDTO request,
            Authentication authentication
    ) {
        return studentService.updateStudent(id, request, authentication);
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void toggleStudentStatus(@PathVariable Long id, Authentication authentication) {
        studentService.toggleStudentStatus(id, authentication);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStudent(@PathVariable Long id, Authentication authentication) {
        studentService.deleteStudent(id, authentication);
    }
}