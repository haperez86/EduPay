package com.escuelaconduccion.control_pagos.branch.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchDTO {

    private Long id;
    private String code;
    private String name;
    private String address;
    private String phone;
    private String email;
    private Boolean isMain;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
