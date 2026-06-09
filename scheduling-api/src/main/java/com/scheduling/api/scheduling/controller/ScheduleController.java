package com.scheduling.api.scheduling.controller;

import com.scheduling.api.doc.ScheduleControllerDoc;
import com.scheduling.api.scheduling.dto.AvailableSlotResponse;
import com.scheduling.api.scheduling.dto.ScheduleBlockRequest;
import com.scheduling.api.scheduling.dto.ScheduleBlockResponse;
import com.scheduling.api.scheduling.dto.ScheduleRequest;
import com.scheduling.api.scheduling.dto.ScheduleResponse;
import com.scheduling.api.scheduling.service.AvaliabilityService;
import com.scheduling.api.scheduling.service.ScheduleService;
import com.scheduling.api.user.model.User;
import com.scheduling.api.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/schedules")
@RequiredArgsConstructor
public class ScheduleController implements ScheduleControllerDoc {

    private final AvaliabilityService avaliabilityService;
    private final ScheduleService scheduleService;
    private final UserRepository userRepository;

    // ── Endpoints públicos / leitura ─────────────────────────────────────────

    @GetMapping("/available")
    public ResponseEntity<List<AvailableSlotResponse>> getAvaliable(
            @RequestParam Long companyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(avaliabilityService.getAvailableSlots(companyId, date));
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<ScheduleResponse>> getByCompany(@PathVariable Long companyId) {
        return ResponseEntity.ok(scheduleService.findByCompany(companyId));
    }

    // ── Mutações — ADMIN ou MANAGER da própria empresa ───────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ScheduleResponse> create(
            @RequestBody @Valid ScheduleRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(scheduleService.create(req, resolveUser(principal)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ScheduleResponse> update(
            @PathVariable Long id,
            @RequestBody @Valid ScheduleRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(scheduleService.update(id, req, resolveUser(principal)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        scheduleService.delete(id, resolveUser(principal));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/blocks")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ScheduleBlockResponse> createBlock(
            @RequestBody ScheduleBlockRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(scheduleService.createBlock(req, resolveUser(principal)));
    }

    @GetMapping("/blocks")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','PROFESSIONAL')")
    public ResponseEntity<List<ScheduleBlockResponse>> listBlocks(
            @RequestParam Long companyId,
            @RequestParam(required = false) Long professionalId,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(scheduleService.findBlocks(companyId, professionalId, resolveUser(principal)));
    }

    @DeleteMapping("/blocks/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> deleteBlock(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        scheduleService.deleteBlock(id, resolveUser(principal));
        return ResponseEntity.noContent().build();
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private User resolveUser(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername()).orElseThrow();
    }
}
