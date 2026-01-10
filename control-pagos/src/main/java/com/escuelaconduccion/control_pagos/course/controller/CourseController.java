package com.escuelaconduccion.control_pagos.course.controller;

import com.escuelaconduccion.control_pagos.course.dto.CourseListDTO;
import com.escuelaconduccion.control_pagos.course.dto.CourseRequestDTO;
import com.escuelaconduccion.control_pagos.course.dto.CourseResponseDTO;
import com.escuelaconduccion.control_pagos.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CourseResponseDTO create(@RequestBody CourseRequestDTO request) {
        return courseService.create(request);
    }


    @GetMapping
    public List<CourseListDTO> getCourses(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String name
    ) {
        return courseService.getCourses(active, name);
    }

    @PutMapping("/{id}")
    public CourseResponseDTO updateCourse(
            @PathVariable Long id,
            @RequestBody CourseRequestDTO request
    ) {
        return courseService.updateCourse(id, request);
    }

    @PatchMapping("/{id}/toggle-status")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void toggleCourseStatus(@PathVariable Long id) {
            courseService.toggleCourseStatus(id);
    }
}

