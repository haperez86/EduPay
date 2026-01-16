package com.escuelaconduccion.control_pagos.student.service;

import com.escuelaconduccion.control_pagos.student.dto.StudentListDTO;
import com.escuelaconduccion.control_pagos.student.dto.StudentRequestDTO;
import com.escuelaconduccion.control_pagos.student.dto.StudentResponseDTO;
import com.escuelaconduccion.control_pagos.student.model.Student;
import com.escuelaconduccion.control_pagos.student.repository.StudentRepository;
import com.escuelaconduccion.control_pagos.branch.model.Branch;
import com.escuelaconduccion.control_pagos.branch.repository.BranchRepository;
import com.escuelaconduccion.control_pagos.auth.model.User;
import com.escuelaconduccion.control_pagos.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;

    public StudentResponseDTO create(StudentRequestDTO request, Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User currentUser = userRepository.findByUsernameAndActiveTrueWithBranch(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        // Determinar la sede para el estudiante
        Long targetBranchId;
        if (currentUser.getRole().equals("SUPER_ADMIN") && request.getBranchId() != null) {
            // SUPER_ADMIN puede asignar cualquier sede
            targetBranchId = request.getBranchId();
        } else {
            // ADMIN solo puede crear estudiantes de su propia sede
            targetBranchId = currentUser.getBranch() != null ? currentUser.getBranch().getId() : null;
        }

        // Obtener la sede
        Branch branch = null;
        if (targetBranchId != null) {
            branch = branchRepository.findById(targetBranchId)
                    .orElseThrow(() -> new RuntimeException("Sede no encontrada"));
        }

        // Verificar si el estudiante ya existe por número de documento (globalmente)
        if (studentRepository.findByDocumentNumber(request.getDocumentNumber()).isPresent()) {
            throw new RuntimeException("Ya existe un estudiante con este número de documento");
        }

        Student student = Student.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .documentNumber(request.getDocumentNumber())
                .email(request.getEmail())
                .phone(request.getPhone())
                .active(request.getActive() != null ? request.getActive() : true)
                .branch(branch)
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
                .branchId(saved.getBranch() != null ? saved.getBranch().getId() : null)
                .branchName(saved.getBranch() != null ? saved.getBranch().getName() : null)
                .build();
    }

    public List<StudentListDTO> getAllStudents() {
        return studentRepository.findAllWithBranch().stream()
                .map(s -> new StudentListDTO(
                        s.getId(),
                        s.getDocumentNumber(),
                        s.getFirstName(),
                        s.getLastName(),
                        s.getEmail(),
                        s.getPhone(),
                        s.getActive(),
                        s.getBranch() != null ? s.getBranch().getId() : null,
                        s.getBranch() != null ? s.getBranch().getName() : null
                ))
                .collect(Collectors.toList());
        }

    public List<StudentListDTO> getStudents(
                Boolean active,
                String document,
                String name,
                Long branchId,  // Solo para SUPER_ADMIN
                Authentication authentication
        ) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User currentUser = userRepository.findByUsernameAndActiveTrueWithBranch(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        System.out.println("=== DEBUG StudentService.getStudents ===");
        System.out.println("Usuario: " + currentUser.getUsername());
        System.out.println("Rol: " + currentUser.getRole());
        System.out.println("BranchId Usuario: " + (currentUser.getBranch() != null ? currentUser.getBranch().getId() : "NULL"));
        System.out.println("BranchId Parámetro: " + branchId);
        System.out.println("Active: " + active);
        System.out.println("Document: " + document);
        System.out.println("Name: " + name);
        
        List<Student> students;

        // Determinar qué sede usar para filtrar
        Long filterBranchId;
        if (currentUser.getRole().equals("SUPER_ADMIN")) {
            // SUPER_ADMIN puede ver cualquier sede o filtrar por una específica
            filterBranchId = branchId;
            System.out.println("SUPER_ADMIN detectado, filterBranchId: " + filterBranchId);
        } else {
            // ADMIN solo puede ver estudiantes de su propia sede
            filterBranchId = currentUser.getBranch() != null ? currentUser.getBranch().getId() : null;
            System.out.println("ADMIN detectado, filterBranchId: " + filterBranchId);
        }

        // Aplicar filtros
        if (currentUser.getRole().equals("SUPER_ADMIN") && filterBranchId == null) {
            // SUPER_ADMIN sin filtro de sede: ver TODOS los estudiantes
            students = studentRepository.findAllWithBranch();
            System.out.println("SUPER_ADMIN sin filtro de sede, todos los estudiantes: " + students.size());
            
            // Aplicar filtros adicionales
            if (active != null) {
                students = students.stream()
                        .filter(s -> s.getActive().equals(active))
                        .collect(Collectors.toList());
                System.out.println("Después de filtro active: " + students.size());
            }
            if (document != null) {
                students = students.stream()
                        .filter(s -> s.getDocumentNumber().toLowerCase().contains(document.toLowerCase()))
                        .collect(Collectors.toList());
                System.out.println("Después de filtro document: " + students.size());
            }
            if (name != null) {
                students = students.stream()
                        .filter(s -> s.getFirstName().toLowerCase().contains(name.toLowerCase()) || 
                                     s.getLastName().toLowerCase().contains(name.toLowerCase()))
                        .collect(Collectors.toList());
                System.out.println("Después de filtro name: " + students.size());
            }
        } else if (filterBranchId != null) {
            // Filtrar por sede específica
            students = studentRepository.findByBranchIdWithBranch(filterBranchId);
            System.out.println("Estudiantes encontrados por sede " + filterBranchId + ": " + students.size());
            
            // Aplicar filtros adicionales
            if (active != null) {
                students = students.stream()
                        .filter(s -> s.getActive().equals(active))
                        .collect(Collectors.toList());
                System.out.println("Después de filtro active: " + students.size());
            }
            if (document != null) {
                students = students.stream()
                        .filter(s -> s.getDocumentNumber().toLowerCase().contains(document.toLowerCase()))
                        .collect(Collectors.toList());
                System.out.println("Después de filtro document: " + students.size());
            }
            if (name != null) {
                students = students.stream()
                        .filter(s -> s.getFirstName().toLowerCase().contains(name.toLowerCase()) || 
                                     s.getLastName().toLowerCase().contains(name.toLowerCase()))
                        .collect(Collectors.toList());
                System.out.println("Después de filtro name: " + students.size());
            }
        } else {
            // Si no hay sede, devolver lista vacía (caso de ADMIN sin sede asignada)
            students = List.of();
            System.out.println("Sin filtro de sede, lista vacía");
        }

        System.out.println("Total estudiantes a devolver: " + students.size());
        System.out.println("=== FIN DEBUG StudentService.getStudents ===");

        return students.stream()
                .map(s -> new StudentListDTO(
                        s.getId(),
                        s.getDocumentNumber(),
                        s.getFirstName(),
                        s.getLastName(),
                        s.getEmail(),
                        s.getPhone(),
                        s.getActive(),
                        s.getBranch() != null ? s.getBranch().getId() : null,
                        s.getBranch() != null ? s.getBranch().getName() : null
                ))
                .collect(Collectors.toList());
        }

    public List<StudentListDTO> getPublicStudents(Long branchId, String document) {
        List<Student> students;

        if (branchId != null) {
            students = studentRepository.findByBranchIdAndActiveTrue(branchId);
        } else if (document != null) {
            students = studentRepository.findByDocumentNumberContainingIgnoreCaseAndActiveTrue(document);
        } else {
            students = studentRepository.findByActiveTrue();
        }

        return students.stream()
                .map(s -> new StudentListDTO(
                        s.getId(),
                        s.getDocumentNumber(),
                        s.getFirstName(),
                        s.getLastName(),
                        s.getEmail(),
                        s.getPhone(),
                        s.getActive(),
                        s.getBranch() != null ? s.getBranch().getId() : null,
                        s.getBranch() != null ? s.getBranch().getName() : null
                ))
                .collect(Collectors.toList());
    }

    public StudentResponseDTO getStudent(Long id, Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User currentUser = userRepository.findByUsernameAndActiveTrueWithBranch(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Verificar que el usuario tenga permiso para ver este estudiante
        if (!currentUser.getRole().equals("SUPER_ADMIN") && 
            (currentUser.getBranch() == null || 
             student.getBranch() == null || 
             !currentUser.getBranch().getId().equals(student.getBranch().getId()))) {
            throw new RuntimeException("No tienes permiso para ver este estudiante");
        }

        return StudentResponseDTO.builder()
                .id(student.getId())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .documentNumber(student.getDocumentNumber())
                .email(student.getEmail())
                .phone(student.getPhone())
                .active(student.getActive())
                .branchId(student.getBranch() != null ? student.getBranch().getId() : null)
                .branchName(student.getBranch() != null ? student.getBranch().getName() : null)
                .build();
    }

    public StudentResponseDTO updateStudent(Long id, StudentRequestDTO request, Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User currentUser = userRepository.findByUsernameAndActiveTrueWithBranch(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Verificar que el usuario tenga permiso para editar este estudiante
        if (!currentUser.getRole().equals("SUPER_ADMIN") && 
            (currentUser.getBranch() == null || 
             student.getBranch() == null || 
             !currentUser.getBranch().getId().equals(student.getBranch().getId()))) {
            throw new RuntimeException("No tienes permiso para editar este estudiante");
        }

        // Verificar si el número de documento ya está siendo usado por otro estudiante
        if (!request.getDocumentNumber().equals(student.getDocumentNumber())) {
            studentRepository.findByDocumentNumber(request.getDocumentNumber())
                    .ifPresent(existingStudent -> {
                        if (!existingStudent.getId().equals(student.getId())) {
                            throw new RuntimeException("Ya existe un estudiante con este número de documento");
                        }
                    });
        }

        student.setFirstName(request.getFirstName());
        student.setLastName(request.getLastName());
        student.setDocumentNumber(request.getDocumentNumber());
        student.setEmail(request.getEmail());
        student.setPhone(request.getPhone());
        student.setActive(request.getActive() != null ? request.getActive() : student.getActive());

        // Actualizar sede solo si es SUPER_ADMIN
        if (currentUser.getRole().equals("SUPER_ADMIN") && request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new RuntimeException("Sede no encontrada"));
            student.setBranch(branch);
        }

        studentRepository.save(student);

        return StudentResponseDTO.builder()
                .id(student.getId())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .documentNumber(student.getDocumentNumber())
                .email(student.getEmail())
                .phone(student.getPhone())
                .active(student.getActive())
                .branchId(student.getBranch() != null ? student.getBranch().getId() : null)
                .branchName(student.getBranch() != null ? student.getBranch().getName() : null)
                .build();
    }

    public void deleteStudent(Long id, Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User currentUser = userRepository.findByUsernameAndActiveTrueWithBranch(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Verificar que el usuario tenga permiso para eliminar este estudiante
        if (!currentUser.getRole().equals("SUPER_ADMIN") && 
            (currentUser.getBranch() == null || 
             student.getBranch() == null || 
             !currentUser.getBranch().getId().equals(student.getBranch().getId()))) {
            throw new RuntimeException("No tienes permiso para eliminar este estudiante");
        }

        studentRepository.delete(student);
    }

    public void toggleStudentStatus(Long id, Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User currentUser = userRepository.findByUsernameAndActiveTrueWithBranch(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Verificar que el usuario tenga permiso para modificar este estudiante
        if (!currentUser.getRole().equals("SUPER_ADMIN") && 
            (currentUser.getBranch() == null || 
             student.getBranch() == null || 
             !currentUser.getBranch().getId().equals(student.getBranch().getId()))) {
            throw new RuntimeException("No tienes permiso para modificar este estudiante");
        }

        student.setActive(!student.getActive());
        studentRepository.save(student);
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
