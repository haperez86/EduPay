package com.escuelaconduccion.control_pagos.course.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CourseResponseDTO {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer totalHours;
    private Boolean active;
}
