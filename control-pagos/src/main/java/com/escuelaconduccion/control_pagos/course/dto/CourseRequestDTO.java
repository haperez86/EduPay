package com.escuelaconduccion.control_pagos.course.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CourseRequestDTO {

    private String name;
    private String description;
    private BigDecimal price;
    private Integer totalHours;
    private Boolean active;
}
