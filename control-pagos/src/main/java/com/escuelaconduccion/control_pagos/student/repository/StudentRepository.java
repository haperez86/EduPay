package com.escuelaconduccion.control_pagos.student.repository;

import com.escuelaconduccion.control_pagos.student.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    List<Student> findByActive(Boolean active);

    List<Student> findByActiveTrue();

    List<Student> findByDocumentNumberContainingIgnoreCase(String documentNumber);

    List<Student> findByDocumentNumberContainingIgnoreCaseAndActiveTrue(String documentNumber);

    Optional<Student> findByDocumentNumber(String documentNumber);

    List<Student> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            String firstName,
            String lastName
    );

    // Métodos para filtrar por sede
    List<Student> findByBranchId(Long branchId);

    List<Student> findByBranchIdAndActiveTrue(Long branchId);

    @Query("SELECT s FROM Student s LEFT JOIN FETCH s.branch WHERE s.branch.id = :branchId")
    List<Student> findByBranchIdWithBranch(Long branchId);

    @Query("SELECT s FROM Student s LEFT JOIN FETCH s.branch WHERE s.id = :id")
    Student findByIdWithBranch(Long id);

    @Query("SELECT s FROM Student s LEFT JOIN FETCH s.branch ORDER BY s.lastName, s.firstName")
    List<Student> findAllWithBranch();
}