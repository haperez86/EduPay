package com.escuelaconduccion.control_pagos.enrollment.service;

import com.escuelaconduccion.control_pagos.course.model.Course;
import com.escuelaconduccion.control_pagos.course.repository.CourseRepository;
import com.escuelaconduccion.control_pagos.enrollment.dto.EnrollmentRequestDTO;
import com.escuelaconduccion.control_pagos.enrollment.dto.EnrollmentResponseDTO;
import com.escuelaconduccion.control_pagos.enrollment.dto.EnrollmentSummaryDTO;
import com.escuelaconduccion.control_pagos.enrollment.model.Enrollment;
import com.escuelaconduccion.control_pagos.enrollment.repository.EnrollmentRepository;
import com.escuelaconduccion.control_pagos.student.model.Student;
import com.escuelaconduccion.control_pagos.student.repository.StudentRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             StudentRepository studentRepository,
                             CourseRepository courseRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
    }

    @Transactional
        public EnrollmentResponseDTO createEnrollment(EnrollmentRequestDTO request) {

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado"));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new IllegalArgumentException("Curso no encontrado"));

        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .course(course)
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

        @Transactional
        public List<EnrollmentResponseDTO> getAllEnrollments() {
        return enrollmentRepository.findAll().stream()
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

