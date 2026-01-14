package com.escuelaconduccion.control_pagos.auth.service;

import com.escuelaconduccion.control_pagos.auth.dto.RegisterRequestDTO;
import com.escuelaconduccion.control_pagos.auth.model.User;
import com.escuelaconduccion.control_pagos.auth.repository.UserRepository;
import com.escuelaconduccion.control_pagos.branch.model.Branch;
import com.escuelaconduccion.control_pagos.branch.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BranchRepository branchRepository;

    public User createUser(RegisterRequestDTO request) {
        // Verificar si el usuario ya existe
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("El usuario ya existe");
        }

        // Encriptar la contraseña
        String encryptedPassword = passwordEncoder.encode(request.getPassword());

        // Obtener la sede si se especificó
        Branch branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new RuntimeException("Sede no encontrada"));
        }

        // Crear y guardar el usuario
        User.UserBuilder userBuilder = User.builder()
                .username(request.getUsername())
                .password(encryptedPassword)
                .role(request.getRole() != null ? request.getRole() : "ADMIN")
                .active(true);

        // Asignar sede si se especificó
        if (branch != null) {
            userBuilder.branch(branch);
        }

        return userRepository.save(userBuilder.build());
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
