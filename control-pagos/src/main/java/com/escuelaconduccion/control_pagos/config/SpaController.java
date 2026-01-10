package com.escuelaconduccion.control_pagos.config;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@Controller
public class SpaController {

    @GetMapping("/")
    public ResponseEntity<Resource> serveIndex() throws IOException {
        Resource resource = new ClassPathResource("static/index.html");
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(resource);
    }

    @GetMapping({"/login", "/register", "/dashboard", "/students", "/courses", "/payments", "/enrollments", "/reports"})
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
