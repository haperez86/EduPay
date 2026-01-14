package com.escuelaconduccion.control_pagos.auth.service;

import com.escuelaconduccion.control_pagos.auth.dto.LoginRequestDTO;
import com.escuelaconduccion.control_pagos.auth.dto.LoginResponseDTO;
import com.escuelaconduccion.control_pagos.auth.model.User;
import com.escuelaconduccion.control_pagos.auth.repository.UserRepository;
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
    private final UserRepository userRepository;

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
            
            // Obtener usuario completo con su branch
            User user = userRepository.findByUsernameAndActiveTrueWithBranch(request.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            // Generar JWT token
            String token = jwtService.generateToken(userDetails);
            
            return new LoginResponseDTO(token, user);
            
        } catch (AuthenticationException e) {
            throw new RuntimeException("Credenciales inválidas");
        }
    }
}
