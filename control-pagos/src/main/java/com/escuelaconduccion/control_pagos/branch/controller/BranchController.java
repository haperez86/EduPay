package com.escuelaconduccion.control_pagos.branch.controller;

import com.escuelaconduccion.control_pagos.branch.model.Branch;
import com.escuelaconduccion.control_pagos.branch.service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    @GetMapping("/public")
    public ResponseEntity<List<Branch>> getPublicBranches() {
        return ResponseEntity.ok(branchService.findAllActiveBranches());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<List<Branch>> getAllActiveBranches() {
        return ResponseEntity.ok(branchService.findAllActiveBranches());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Branch> getBranchById(@PathVariable Long id) {
        return branchService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Branch> getBranchByCode(@PathVariable String code) {
        return branchService.findByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/main")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Branch> getMainBranch() {
        return branchService.findMainBranch()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Branch> createBranch(@RequestBody Branch branch) {
        try {
            Branch savedBranch = branchService.createBranch(branch);
            return ResponseEntity.ok(savedBranch);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Branch> updateBranch(@PathVariable Long id, @RequestBody Branch branch) {
        try {
            Branch updatedBranch = branchService.updateBranch(id, branch);
            return ResponseEntity.ok(updatedBranch);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Void> deleteBranch(@PathVariable Long id) {
        try {
            branchService.deleteBranch(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
