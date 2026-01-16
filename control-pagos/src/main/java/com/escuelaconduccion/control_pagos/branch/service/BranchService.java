package com.escuelaconduccion.control_pagos.branch.service;

import com.escuelaconduccion.control_pagos.branch.model.Branch;
import com.escuelaconduccion.control_pagos.branch.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class BranchService {

    private final BranchRepository branchRepository;

    public List<Branch> findAllActiveBranches() {
        return branchRepository.findByActiveTrueOrderByIsMainDescNameAsc();
    }

    public Optional<Branch> findById(Long id) {
        return branchRepository.findById(id);
    }

    public Optional<Branch> findByCode(String code) {
        return branchRepository.findByCode(code);
    }

    public Optional<Branch> findMainBranch() {
        return branchRepository.findByIsMainTrueAndActiveTrue();
    }

    public Branch save(Branch branch) {
        return branchRepository.save(branch);
    }

    public Branch createBranch(Branch branch) {
        if (branchRepository.existsByCode(branch.getCode())) {
            throw new IllegalArgumentException("Branch code already exists: " + branch.getCode());
        }
        
        // Validar que solo haya una sede principal
        if (branch.getIsMain() != null && branch.getIsMain()) {
            if (branchRepository.findByIsMainTrueAndActiveTrue().isPresent()) {
                throw new IllegalArgumentException("Ya existe una sede principal. Solo puede haber una sede principal.");
            }
        }
        
        return branchRepository.save(branch);
    }

    public Branch updateBranch(Long id, Branch branchDetails) {
        return branchRepository.findById(id)
                .map(branch -> {
                    // Validar que solo haya una sede principal si se está marcando como principal
                    if (branchDetails.getIsMain() != null && branchDetails.getIsMain() && !branch.getIsMain()) {
                        if (branchRepository.findByIsMainTrueAndActiveTrue().isPresent()) {
                            throw new IllegalArgumentException("Ya existe una sede principal. Solo puede haber una sede principal.");
                        }
                    }
                    
                    branch.setName(branchDetails.getName());
                    branch.setAddress(branchDetails.getAddress());
                    branch.setPhone(branchDetails.getPhone());
                    branch.setEmail(branchDetails.getEmail());
                    branch.setActive(branchDetails.getActive());
                    branch.setIsMain(branchDetails.getIsMain());
                    return branchRepository.save(branch);
                })
                .orElseThrow(() -> new RuntimeException("Branch not found with id: " + id));
    }

    public void deleteBranch(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Branch not found with id: " + id));
        branch.setActive(false);
        branchRepository.save(branch);
    }

    public boolean existsByCode(String code) {
        return branchRepository.existsByCode(code);
    }
}
