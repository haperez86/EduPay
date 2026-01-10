package com.escuelaconduccion.control_pagos.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("forward:/index.html");
        registry.addViewController("/login").setViewName("forward:/index.html");
        registry.addViewController("/register").setViewName("forward:/index.html");
        registry.addViewController("/dashboard").setViewName("forward:/index.html");
        registry.addViewController("/students").setViewName("forward:/index.html");
        registry.addViewController("/courses").setViewName("forward:/index.html");
        registry.addViewController("/payments").setViewName("forward:/index.html");
        registry.addViewController("/enrollments").setViewName("forward:/index.html");
        registry.addViewController("/reports").setViewName("forward:/index.html");
    }
}
