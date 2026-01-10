package com.escuelaconduccion.control_pagos.student.service;

import com.escuelaconduccion.control_pagos.student.dto.StudentListDTO;
import com.escuelaconduccion.control_pagos.student.dto.StudentRequestDTO;
import com.escuelaconduccion.control_pagos.student.dto.StudentResponseDTO;
import com.escuelaconduccion.control_pagos.student.model.Student;
import com.escuelaconduccion.control_pagos.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentResponseDTO create(StudentRequestDTO request) {

        Student student = Student.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .documentNumber(request.getDocumentNumber())
                .email(request.getEmail())
                .phone(request.getPhone())
                .active(true)
                .build();

        Student saved = studentRepository.save(student);

        return StudentResponseDTO.builder()
                .id(saved.getId())
                .firstName(saved.getFirstName())
                .lastName(saved.getLastName())
                .documentNumber(saved.getDocumentNumber())
                .email(saved.getEmail())
                .phone(saved.getPhone())
                .active(saved.getActive())
                .build();
    }

    public List<StudentListDTO> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(s -> new StudentListDTO(
                        s.getId(),
                        s.getDocumentNumber(),  // documentNumber
                        s.getFirstName(),        // firstName
                        s.getLastName(),         // lastName
                        s.getEmail(),           // email
                        s.getPhone(),           // phone
                        s.getActive()
                ))
                .toList();
        }

    public List<StudentListDTO> getStudents(
                Boolean active,
                String document,
                String name
        ) {
        List<Student> students;

        if (document != null) {
                students = studentRepository
                        .findByDocumentNumberContainingIgnoreCase(document);
        } else if (name != null) {
                students = studentRepository
                        .findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                                name, name);
        } else if (active != null) {
                students = studentRepository.findByActive(active);
        } else {
                students = studentRepository.findAll();
        }

        return students.stream()
                .map(s -> new StudentListDTO(
                        s.getId(),
                        s.getDocumentNumber(),
                        s.getFirstName(),
                        s.getLastName(),
                        s.getEmail(),
                        s.getPhone(),
                        s.getActive()
                ))
                .toList();
        }

    public StudentResponseDTO updateStudent(Long id, StudentRequestDTO request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        student.setFirstName(request.getFirstName());
        student.setLastName(request.getLastName());
        student.setDocumentNumber(request.getDocumentNumber());
        student.setActive(request.getActive() != null ? request.getActive() : student.getActive());

        studentRepository.save(student);

        return StudentResponseDTO.builder()
                .id(student.getId())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .documentNumber(student.getDocumentNumber())
                .email(student.getEmail())
                .phone(student.getPhone())
                .active(student.getActive())
                .build();
    }

    public void deactivateStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        student.setActive(false);
        studentRepository.save(student);
    }

    public void toggleStudentStatus(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        student.setActive(!student.getActive()); // Invierte el estado
        studentRepository.save(student);
        }
}
