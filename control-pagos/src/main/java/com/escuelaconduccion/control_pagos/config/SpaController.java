package com.escuelaconduccion.control_pagos.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({"/", "/login", "/register", "/dashboard", "/students", "/courses", "/payments", "/enrollments", "/reports"})
    public String index() {
        return "index.html";
    }
}
