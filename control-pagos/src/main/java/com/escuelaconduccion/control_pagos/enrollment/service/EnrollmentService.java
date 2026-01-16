package com.escuelaconduccion.control_pagos.enrollment.service;

import com.escuelaconduccion.control_pagos.auth.model.User;
import com.escuelaconduccion.control_pagos.auth.repository.UserRepository;
import com.escuelaconduccion.control_pagos.branch.model.Branch;
import com.escuelaconduccion.control_pagos.branch.repository.BranchRepository;
import com.escuelaconduccion.control_pagos.course.model.Course;
import com.escuelaconduccion.control_pagos.course.repository.CourseRepository;
import com.escuelaconduccion.control_pagos.enrollment.dto.EnrollmentRequestDTO;
import com.escuelaconduccion.control_pagos.enrollment.dto.EnrollmentResponseDTO;
import com.escuelaconduccion.control_pagos.enrollment.dto.EnrollmentSummaryDTO;
import com.escuelaconduccion.control_pagos.enrollment.model.Enrollment;
import com.escuelaconduccion.control_pagos.enrollment.repository.EnrollmentRepository;
import com.escuelaconduccion.control_pagos.student.model.Student;
import com.escuelaconduccion.control_pagos.student.repository.StudentRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             StudentRepository studentRepository,
                             CourseRepository courseRepository,
                             UserRepository userRepository,
                             BranchRepository branchRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
    }

    @Transactional
        public EnrollmentResponseDTO createEnrollment(EnrollmentRequestDTO request) {
        
        // Obtener usuario autenticado
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User currentUser = userRepository.findByUsernameAndActiveTrueWithBranch(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado"));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new IllegalArgumentException("Curso no encontrado"));

        // Determinar la sede para la inscripción
        Branch branch = null;
        if (currentUser.getRole().equals("SUPER_ADMIN")) {
            // SUPER_ADMIN puede asignar cualquier sede (si viene en el request)
            if (request.getBranchId() != null) {
                branch = branchRepository.findById(request.getBranchId())
                        .orElseThrow(() -> new IllegalArgumentException("Sede no encontrada"));
            } else {
                // Si no especifica sede, usar la sede del estudiante
                branch = student.getBranch();
            }
        } else {
            // ADMIN solo puede crear inscripciones de su propia sede
            branch = currentUser.getBranch();
        }

        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .course(course)
                .branch(branch)
                .enrollmentDate(LocalDate.now())
                .totalAmount(course.getPrice()) // AUTOMÁTICO desde el curso
                .paidAmount(BigDecimal.ZERO)
                .active(true)
                .build();

        Enrollment saved = enrollmentRepository.save(enrollment);

        return EnrollmentResponseDTO.builder()
                .id(saved.getId())
                .studentId(student.getId())
                .studentName(student.getFirstName() + " " + student.getLastName())
                .studentDocument(student.getDocumentNumber())
                .studentEmail(student.getEmail())
                .courseId(course.getId())
                .courseName(course.getName())
                .enrollmentDate(saved.getEnrollmentDate())
                .totalAmount(saved.getTotalAmount())
                .paidAmount(saved.getPaidAmount())
                .active(saved.getActive())
                .build();
        }

        @Transactional
        public EnrollmentResponseDTO getEnrollmentById(Long id) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Matrícula no encontrada"));
        
        Student student = enrollment.getStudent();
        Course course = enrollment.getCourse();

        return EnrollmentResponseDTO.builder()
                .id(enrollment.getId())
                .studentId(student.getId())
                .studentName(student.getFirstName() + " " + student.getLastName())
                .studentDocument(student.getDocumentNumber())
                .studentEmail(student.getEmail())
                .courseId(course.getId())
                .courseName(course.getName())
                .enrollmentDate(enrollment.getEnrollmentDate())
                .totalAmount(enrollment.getTotalAmount())
                .paidAmount(enrollment.getPaidAmount())
                .active(enrollment.getActive())
                .build();
        }

    @Transactional
    public EnrollmentSummaryDTO getEnrollmentSummary(Long enrollmentId) {

        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Matrícula no encontrada"));

        BigDecimal pendingAmount = enrollment.getTotalAmount()
                .subtract(enrollment.getPaidAmount());

        String status;
        if (pendingAmount.compareTo(BigDecimal.ZERO) == 0) {
            status = "PAGADO";
        } else if (enrollment.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            status = "EN_PROGRESO";
        } else {
            status = "PENDIENTE";
        }

        return EnrollmentSummaryDTO.builder()
                .enrollmentId(enrollment.getId())
                .totalAmount(enrollment.getTotalAmount())
                .paidAmount(enrollment.getPaidAmount())
                .pendingAmount(pendingAmount)
                .status(status)
                .build();
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponseDTO> getAllEnrollments(Long branchId) {
        // Obtener usuario autenticado
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User currentUser = userRepository.findByUsernameAndActiveTrueWithBranch(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        System.out.println("=== DEBUG EnrollmentService.getAllEnrollments ===");
        System.out.println("Usuario: " + currentUser.getUsername());
        System.out.println("Rol: " + currentUser.getRole());
        System.out.println("BranchId Usuario: " + (currentUser.getBranch() != null ? currentUser.getBranch().getId() : "null"));
        System.out.println("BranchId Parámetro: " + branchId);
        
        List<Enrollment> enrollments;
        Long filterBranchId = null;

        if (currentUser.getRole().equals("SUPER_ADMIN")) {
            // SUPER_ADMIN puede ver todas las inscripciones o filtrar por una sede específica
            if (branchId != null) {
                filterBranchId = branchId;
                System.out.println("SUPER_ADMIN detectado, filtrando por branchId parámetro: " + filterBranchId);
            } else {
                System.out.println("SUPER_ADMIN detectado, sin filtro de sede (mostrando todas)");
            }
        } else if (currentUser.getRole().equals("ADMIN")) {
            // ADMIN solo puede ver inscripciones de su sede (ignorar parámetro branchId)
            if (currentUser.getBranch() == null) {
                throw new RuntimeException("El administrador no tiene una sede asignada.");
            }
            filterBranchId = currentUser.getBranch().getId();
            System.out.println("ADMIN detectado, filtrando por sede asignada: " + filterBranchId);
        } else {
            throw new RuntimeException("Rol de usuario no autorizado para ver inscripciones.");
        }

        if (filterBranchId == null) {
            // Si no hay un branchId específico (SUPER_ADMIN sin filtro), obtener todos
            enrollments = enrollmentRepository.findAllWithBranch();
            System.out.println("Estudiantes encontrados (todos): " + enrollments.size());
        } else {
            // Filtrar por sede específica
            enrollments = enrollmentRepository.findByBranchIdWithBranch(filterBranchId);
            System.out.println("Estudiantes encontrados por sede " + filterBranchId + ": " + enrollments.size());
        }
        
        System.out.println("Total inscripciones a devolver: " + enrollments.size());
        System.out.println("=== FIN DEBUG EnrollmentService.getAllEnrollments ===");
        
        return enrollments.stream()
                .map(enrollment -> {
                        Student student = enrollment.getStudent();
                        Course course = enrollment.getCourse();
                        
                        return EnrollmentResponseDTO.builder()
                                .id(enrollment.getId())
                                .studentId(student.getId())
                                .studentName(student.getFirstName() + " " + student.getLastName())
                                .studentDocument(student.getDocumentNumber())
                                .studentEmail(student.getEmail())
                                .courseId(course.getId())
                                .courseName(course.getName())
                                .enrollmentDate(enrollment.getEnrollmentDate())
                                .totalAmount(enrollment.getTotalAmount())
                                .paidAmount(enrollment.getPaidAmount())
                                .active(enrollment.getActive())
                                .build();
                })
                .toList();
    }

}

