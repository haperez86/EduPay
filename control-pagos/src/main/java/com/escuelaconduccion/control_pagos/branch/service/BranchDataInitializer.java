package com.escuelaconduccion.control_pagos.branch.service;

import com.escuelaconduccion.control_pagos.branch.model.Branch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(1)
public class BranchDataInitializer implements CommandLineRunner {

    private final BranchService branchService;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        initializeBranches();
    }

    private void initializeBranches() {
        if (branchService.findAllActiveBranches().isEmpty()) {
            log.info("Initializing branches data...");

            Branch duitama = Branch.builder()
                    .code("DUI")
                    .name("Duitama - Principal")
                    .address("Calle 12 # 5-45, Duitama")
                    .phone("3114567890")
                    .email("duitama@escuela.com")
                    .isMain(true)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            Branch sogamoso = Branch.builder()
                    .code("SOG")
                    .name("Sogamoso")
                    .address("Carrera 8 # 10-23, Sogamoso")
                    .phone("3114567891")
                    .email("sogamoso@escuela.com")
                    .isMain(false)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            Branch soata = Branch.builder()
                    .code("SOA")
                    .name("Soatá")
                    .address("Calle 7 # 3-12, Soatá")
                    .phone("3114567892")
                    .email("soata@escuela.com")
                    .isMain(false)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            Branch socha = Branch.builder()
                    .code("SOC")
                    .name("Socha")
                    .address("Avenida Central # 15-67, Socha")
                    .phone("3114567893")
                    .email("socha@escuela.com")
                    .isMain(false)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            branchService.save(duitama);
            branchService.save(sogamoso);
            branchService.save(soata);
            branchService.save(socha);

            log.info("Branches initialized successfully: 4 branches created");
        } else {
            log.info("Branches already exist, skipping initialization");
        }
    }
}
