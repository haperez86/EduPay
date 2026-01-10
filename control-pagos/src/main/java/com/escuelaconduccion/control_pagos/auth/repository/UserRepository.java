package com.escuelaconduccion.control_pagos.auth.repository;

import com.escuelaconduccion.control_pagos.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameAndActiveTrue(String username);
}
