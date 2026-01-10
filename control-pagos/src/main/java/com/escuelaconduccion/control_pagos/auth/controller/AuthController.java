package com.escuelaconduccion.control_pagos.auth.controller;

import com.escuelaconduccion.control_pagos.auth.dto.*;
import com.escuelaconduccion.control_pagos.auth.service.AuthService;
import com.escuelaconduccion.control_pagos.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/login")
    public LoginResponseDTO login(@RequestBody LoginRequestDTO request) {
        System.out.println("ENTRÓ AL LOGIN");
        return authService.login(request);
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequestDTO request) {
        try {
            userService.createUser(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body("Usuario registrado exitosamente");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    @PostMapping("/update-password")
    public ResponseEntity<String> updatePassword(@RequestBody UpdatePasswordDTO request) {
        try {
            userService.updatePassword(request.getUsername(), request.getNewPassword());
            return ResponseEntity.ok("Contraseña actualizada exitosamente");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    @GetMapping("/generate-hash")
    public ResponseEntity<?> generateHash(@RequestParam String password) {
        String hash = userService.generatePasswordHash(password);
        return ResponseEntity.ok(new java.util.HashMap<String, String>() {{
            put("password", password);
            put("hash", hash);
            put("sql", "UPDATE users SET password = '" + hash + "' WHERE username = 'admin';");
        }});
    }
}
