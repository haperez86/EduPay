package com.escuelaconduccion.control_pagos.auth.dto;

import com.escuelaconduccion.control_pagos.auth.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponseDTO {
    private String token;
    private User user;
}
