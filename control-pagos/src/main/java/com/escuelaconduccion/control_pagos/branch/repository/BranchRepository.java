package com.escuelaconduccion.control_pagos.branch.repository;

import com.escuelaconduccion.control_pagos.branch.model.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    
    Optional<Branch> findByCode(String code);
    
    List<Branch> findByActiveTrueOrderByIsMainDescNameAsc();
    
    Optional<Branch> findByIsMainTrueAndActiveTrue();
    
    @Query("SELECT b FROM Branch b WHERE b.active = true ORDER BY b.name")
    List<Branch> findAllActiveBranches();
    
    boolean existsByCode(String code);
}
