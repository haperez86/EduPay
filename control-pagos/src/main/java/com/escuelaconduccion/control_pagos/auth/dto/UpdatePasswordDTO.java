package com.escuelaconduccion.control_pagos.auth.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePasswordDTO {
    private String username;
    private String newPassword;
}
