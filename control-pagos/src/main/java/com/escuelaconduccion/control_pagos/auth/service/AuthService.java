package com.escuelaconduccion.control_pagos.auth.service;

import com.escuelaconduccion.control_pagos.auth.dto.LoginRequestDTO;
import com.escuelaconduccion.control_pagos.auth.dto.LoginResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.security.core.AuthenticationException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public LoginResponseDTO login(LoginRequestDTO request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );

            // Obtener UserDetails para generar JWT
            UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
            
            // Generar JWT token
            String token = jwtService.generateToken(userDetails);
            
            return new LoginResponseDTO(token);
            
        } catch (AuthenticationException e) {
            throw new RuntimeException("Credenciales inválidas");
        }
    }
}
