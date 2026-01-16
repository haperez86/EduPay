package com.escuelaconduccion.control_pagos.course.service;

import com.escuelaconduccion.control_pagos.course.dto.CourseListDTO;
import com.escuelaconduccion.control_pagos.course.dto.CourseRequestDTO;
import com.escuelaconduccion.control_pagos.course.dto.CourseResponseDTO;
import com.escuelaconduccion.control_pagos.course.model.Course;
import com.escuelaconduccion.control_pagos.course.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseResponseDTO create(CourseRequestDTO request) {

        // Verificar si ya existe un curso con el mismo nombre
        if (courseRepository.existsByNameIgnoreCase(request.getName())) {
            throw new RuntimeException("Ya existe un curso con el nombre: " + request.getName());
        }

        Course course = Course.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice() != null ? request.getPrice() : java.math.BigDecimal.ZERO)
                .totalHours(request.getTotalHours())
                .active(true)
                .build();

        Course saved = courseRepository.save(course);

        return CourseResponseDTO.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .price(saved.getPrice())
                .totalHours(saved.getTotalHours())
                .active(saved.getActive())
                .build();
    }

    public List<CourseListDTO> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(c -> new CourseListDTO(
                        c.getId(),
                        c.getName(),
                        c.getDescription(),
                        c.getPrice(),
                        c.getTotalHours(),
                        c.getActive()
                ))
                .toList();
    }

    public List<CourseListDTO> getCourses(Boolean active, String name) {
        List<Course> courses;

        if (name != null) {
            courses = courseRepository.findByNameContainingIgnoreCase(name);
        } else if (active != null) {
            courses = courseRepository.findByActive(active);
        } else {
            courses = courseRepository.findAll();
        }

        return courses.stream()
                .map(c -> new CourseListDTO(
                        c.getId(),
                        c.getName(),
                        c.getDescription(),
                        c.getPrice(),
                        c.getTotalHours(),
                        c.getActive()
                ))
                .toList();
    }

    public CourseResponseDTO updateCourse(Long id, CourseRequestDTO request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Verificar si el nuevo nombre ya existe en otro curso
        Optional<Course> existingCourse = courseRepository.findByNameIgnoreCase(request.getName());
        if (existingCourse.isPresent() && !existingCourse.get().getId().equals(id)) {
            throw new RuntimeException("Ya existe otro curso con el nombre: " + request.getName());
        }

        course.setName(request.getName());
        course.setDescription(request.getDescription());
        course.setPrice(request.getPrice() != null ? request.getPrice() : java.math.BigDecimal.ZERO);
        course.setTotalHours(request.getTotalHours());
        course.setActive(request.getActive() != null ? request.getActive() : course.getActive());

        courseRepository.save(course);

        return CourseResponseDTO.builder()
                .id(course.getId())
                .name(course.getName())
                .description(course.getDescription())
                .price(course.getPrice())
                .totalHours(course.getTotalHours())
                .active(course.getActive())
                .build();
    }

    public void deactivateCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        course.setActive(false);
        courseRepository.save(course);
    }

    public void toggleCourseStatus(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        course.setActive(!course.getActive()); // Invierte el estado
        courseRepository.save(course);
    }
}
