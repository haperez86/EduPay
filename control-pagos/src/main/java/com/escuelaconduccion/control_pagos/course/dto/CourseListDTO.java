package com.escuelaconduccion.control_pagos.course.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CourseListDTO {
    private Long id;
    private String name;        // Cambiar 'code' por 'name'
    private String description; // Agregar
    private BigDecimal price;
    private Integer totalHours; // Agregar
    private Boolean active;
}
