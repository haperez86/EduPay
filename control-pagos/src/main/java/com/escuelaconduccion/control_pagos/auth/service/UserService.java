package com.escuelaconduccion.control_pagos.auth.service;

import com.escuelaconduccion.control_pagos.auth.dto.RegisterRequestDTO;
import com.escuelaconduccion.control_pagos.auth.model.User;
import com.escuelaconduccion.control_pagos.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User createUser(RegisterRequestDTO request) {
        // Verificar si el usuario ya existe
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("El usuario ya existe");
        }

        // Encriptar la contraseña
        String encryptedPassword = passwordEncoder.encode(request.getPassword());

        // Crear y guardar el usuario
        User user = User.builder()
                .username(request.getUsername())
                .password(encryptedPassword)
                .role(request.getRole() != null ? request.getRole() : "ROLE_STUDENT")
                .active(true)
                .build();

        return userRepository.save(user);
    }

    public User updatePassword(String username, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Encriptar la nueva contraseña
        String encryptedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encryptedPassword);

        return userRepository.save(user);
    }

    public String generatePasswordHash(String password) {
        return passwordEncoder.encode(password);
    }
}
