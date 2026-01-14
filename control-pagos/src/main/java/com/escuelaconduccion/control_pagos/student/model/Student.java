package com.escuelaconduccion.control_pagos.student.model;

import com.escuelaconduccion.control_pagos.branch.model.Branch;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, unique = true, length = 20)
    private String documentNumber;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(nullable = false, name = "fecha_registro")
    @Builder.Default
    private LocalDateTime fechaRegistro = LocalDateTime.now();

    @Column
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = true)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Transient
    public String getFullName() {
        return firstName + " " + lastName;
    }
}