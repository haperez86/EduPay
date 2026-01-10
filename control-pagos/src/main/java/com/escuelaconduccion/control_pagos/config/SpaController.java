package com.escuelaconduccion.control_pagos.config;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.io.IOException;

@Controller
public class SpaController {

    @GetMapping({"/", "/login", "/register", "/dashboard", "/students", "/courses", "/payments", "/enrollments", "/reports"})
    public ResponseEntity<Resource> spaRoutes() throws IOException {
        Resource resource = new ClassPathResource("static/index.html");
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(resource);
    }
}
