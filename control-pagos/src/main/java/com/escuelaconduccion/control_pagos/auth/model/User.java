package com.escuelaconduccion.control_pagos.auth.model;

import com.escuelaconduccion.control_pagos.branch.model.Branch;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // SUPER_ADMIN, ADMIN, STUDENT

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = true) // updated_at is now nullable
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}