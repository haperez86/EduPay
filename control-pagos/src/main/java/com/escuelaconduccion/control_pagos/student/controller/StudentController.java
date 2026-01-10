package com.escuelaconduccion.control_pagos.student.controller;

import com.escuelaconduccion.control_pagos.student.dto.StudentListDTO;
import com.escuelaconduccion.control_pagos.student.dto.StudentRequestDTO;
import com.escuelaconduccion.control_pagos.student.dto.StudentResponseDTO;
import com.escuelaconduccion.control_pagos.student.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudentResponseDTO create(@RequestBody StudentRequestDTO request) {
        return studentService.create(request);
    }

    @GetMapping
    public List<StudentListDTO> getStudents(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String document,
            @RequestParam(required = false) String name
    ) {
        return studentService.getStudents(active, document, name);
    }

    @PutMapping("/{id}")
    public StudentResponseDTO updateStudent(
            @PathVariable Long id,
            @RequestBody StudentRequestDTO request
    ) {
        return studentService.updateStudent(id, request);
    }

    @PatchMapping("/{id}/toggle-status")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void toggleStudentStatus(@PathVariable Long id) {
            studentService.toggleStudentStatus(id);
    }
}