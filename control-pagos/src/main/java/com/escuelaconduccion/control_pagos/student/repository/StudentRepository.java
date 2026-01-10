package com.escuelaconduccion.control_pagos.student.repository;

import com.escuelaconduccion.control_pagos.student.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {

    List<Student> findByActive(Boolean active);

    List<Student> findByDocumentNumberContainingIgnoreCase(String documentNumber);

    List<Student> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            String firstName,
            String lastName
    );
}