package com.escuelaconduccion.control_pagos.auth.dto;

import lombok.Data;

@Data
public class LoginRequestDTO {
    private String username;
    private String password;
}
