package com.escuelaconduccion.control_pagos.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Servir archivos estáticos del frontend
        registry.addResourceHandler("/assets/**", "/static/**", "/favicon.ico", "/robots.txt")
                .addResourceLocations("classpath:/static/")
                .setCachePeriod(3600);
    }
}
