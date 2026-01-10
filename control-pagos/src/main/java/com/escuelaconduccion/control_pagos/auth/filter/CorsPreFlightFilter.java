package com.escuelaconduccion.control_pagos.auth.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Component
public class CorsPreFlightFilter extends OncePerRequestFilter {

    @Value("${cors.allowed-origins:}")
    private String corsAllowedOrigins;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String origin = request.getHeader("Origin");
        if (origin != null && isAllowedOrigin(origin)) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            response.setHeader("Access-Control-Max-Age", "3600");

            if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                response.setStatus(HttpServletResponse.SC_OK);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAllowedOrigin(String origin) {
        if (origin == null || origin.isBlank()) {
            return false;
        }

        if (origin.equals("http://localhost:3000") ||
                origin.equals("http://localhost:4200") ||
                origin.equals("http://localhost:5173") ||
                origin.equals("http://127.0.0.1:3000") ||
                origin.equals("http://127.0.0.1:4200") ||
                origin.equals("http://127.0.0.1:5173") ||
                origin.contains("lovable.dev") ||
                origin.contains("localhost")) {
            return true;
        }

        // Permitir deploys típicos del frontend
        if (origin.endsWith(".netlify.app") || origin.endsWith(".vercel.app")) {
            return true;
        }

        // Permitir lista configurable: cors.allowed-origins=http://mi-front.com,https://otro.com
        return Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .anyMatch(origin::equals);
    }
}
