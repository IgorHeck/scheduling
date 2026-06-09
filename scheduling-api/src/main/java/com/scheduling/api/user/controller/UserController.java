package com.scheduling.api.user.controller;

import com.scheduling.api.company.dto.CompanyResponse;
import com.scheduling.api.doc.UserControllerDoc;
import com.scheduling.api.user.dto.AssignCompanyRequest;
import com.scheduling.api.user.dto.CreateManagerRequest;
import com.scheduling.api.user.dto.UpdateUserRequest;
import com.scheduling.api.user.dto.UserResponse;
import com.scheduling.api.user.model.User;
import com.scheduling.api.user.repository.UserRepository;
import com.scheduling.api.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController implements UserControllerDoc {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserDetails principal) {
        // o Spring injeta o UserDetails com o email (username) extraído do JWT
        return userRepository.findByEmail(principal.getUsername())
                .map(u -> ResponseEntity.ok(userService.findById(u.getId())))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me/companies")
    public ResponseEntity<List<CompanyResponse>> myCompanies(@AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(userService.getMyCompanies(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMe(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody @Valid UpdateUserRequest req) {
        return userRepository.findByEmail(principal.getUsername())
                .map(u -> ResponseEntity.ok(userService.update(u.getId(), req)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<UserResponse> createManager(
            @RequestBody @Valid CreateManagerRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        User currentUser = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createManager(req, currentUser));
    }

    @GetMapping("/professionals")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','PROFESSIONAL')")
    public ResponseEntity<List<UserResponse>> findProfessionals(@RequestParam Long companyId) {
        return ResponseEntity.ok(userService.findProfessionalsByCompany(companyId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<List<UserResponse>> findAll(@RequestParam Long companyId) {
        return ResponseEntity.ok(userService.findByCompany(companyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id,
                                                   @RequestBody @Valid UpdateUserRequest req) {
        return ResponseEntity.ok(userService.update(id, req));
    }

    @PutMapping("/{id}/company")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> assignCompany(@PathVariable Long id,
                                                      @RequestBody AssignCompanyRequest req) {
        return ResponseEntity.ok(userService.assignCompany(id, req));
    }

    @DeleteMapping("/{id}/companies/{companyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeFromCompany(@PathVariable Long id,
                                                  @PathVariable Long companyId) {
        userService.removeFromCompany(id, companyId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        userService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
