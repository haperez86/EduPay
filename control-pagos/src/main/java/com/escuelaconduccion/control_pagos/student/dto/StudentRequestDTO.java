package com.escuelaconduccion.control_pagos.student.dto;

import lombok.Data;

@Data
public class StudentRequestDTO {

    private String firstName;
    private String lastName;
    private String documentNumber;
    private String email;
    private String phone;
    private Boolean active;
}
