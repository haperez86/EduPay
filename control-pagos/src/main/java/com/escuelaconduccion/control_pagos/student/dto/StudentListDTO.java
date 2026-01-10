package com.escuelaconduccion.control_pagos.student.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StudentListDTO {
    private Long id;
    private String documentNumber;  // Cambiar de 'document' a 'documentNumber'
    private String firstName;       // Agregar firstName
    private String lastName;        // Agregar lastName
    private String email;           // Agregar email (opcional)
    private String phone;           // Agregar phone (opcional)
    private Boolean active;
}