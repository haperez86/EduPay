package com.escuelaconduccion.control_pagos.course.repository;

import com.escuelaconduccion.control_pagos.course.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByActive(Boolean active);

    List<Course> findByNameContainingIgnoreCase(String name);
    
    Optional<Course> findByNameIgnoreCase(String name);
    
    boolean existsByNameIgnoreCase(String name);
}
