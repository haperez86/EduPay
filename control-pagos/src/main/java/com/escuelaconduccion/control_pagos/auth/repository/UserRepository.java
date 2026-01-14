package com.escuelaconduccion.control_pagos.auth.repository;

import com.escuelaconduccion.control_pagos.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameAndActiveTrue(String username);
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.branch WHERE u.username = :username AND u.active = true")
    Optional<User> findByUsernameAndActiveTrueWithBranch(String username);
}
