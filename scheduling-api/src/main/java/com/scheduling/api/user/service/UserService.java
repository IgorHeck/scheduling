package com.scheduling.api.user.service;

import com.scheduling.api.company.dto.CompanyResponse;
import com.scheduling.api.company.model.Company;
import com.scheduling.api.company.service.CompanyService;
import com.scheduling.api.exception.BusinessException;
import com.scheduling.api.exception.ResourceNotFoundException;
import com.scheduling.api.user.dto.AssignCompanyRequest;
import com.scheduling.api.user.dto.CreateManagerRequest;
import com.scheduling.api.user.dto.UpdateUserRequest;
import com.scheduling.api.user.dto.UserResponse;
import com.scheduling.api.user.model.Role;
import com.scheduling.api.user.model.User;
import com.scheduling.api.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CompanyService companyService;

    @Transactional
    public UserResponse createManager(CreateManagerRequest req, User currentUser) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BusinessException("Email já cadastrado");
        }

        boolean isProfessionalRole = "PROFESSIONAL".equalsIgnoreCase(req.getRole());

        // MANAGER só pode criar usuários com role PROFESSIONAL
        if (currentUser.getRole() == Role.MANAGER && !isProfessionalRole) {
            throw new BusinessException("Managers só podem criar usuários com role Profissional.");
        }

        Role role       = isProfessionalRole ? Role.PROFESSIONAL : Role.MANAGER;
        boolean professional = isProfessionalRole || req.isProfessional();

        Company company = req.getCompanyId() != null
                ? companyService.findCompanyById(req.getCompanyId())
                : null;

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .phone(req.getPhone())
                .role(role)
                .professional(professional)
                .active(true)
                .company(company)
                .build();
        if (company != null) {
            user.getCompanies().add(company);
        }
        return toResponse(userRepository.save(user));
    }

    public List<UserResponse> findProfessionalsByCompany(Long companyId) {
        return userRepository.findProfessionalsByCompanyId(companyId).stream()
                .map(this::toResponse)
                .toList();
    }

    public UserResponse findById(Long id) {
        return toResponse(findUserById(id));
    }

    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<UserResponse> findByCompany(Long companyId) {
        List<User> staff   = userRepository.findStaffByCompanyId(companyId);
        List<User> clients = userRepository.findClientsByCompanyId(companyId);
        return java.util.stream.Stream.concat(staff.stream(), clients.stream())
                .map(this::toResponse)
                .sorted(Comparator.comparing(UserResponse::getName))
                .toList();
    }

    @Transactional
    public void removeFromCompany(Long userId, Long companyId) {
        User user = findUserById(userId);
        user.getCompanies().removeIf(c -> companyId.equals(c.getId()));
        if (user.getCompany() != null && companyId == user.getCompany().getId()) {
            user.setCompany(null);
        }
        userRepository.save(user);
    }

    public UserResponse update(Long id, UpdateUserRequest req) {
        User user = findUserById(id);
        if (req.getName() != null)         user.setName(req.getName());
        if (req.getPhone() != null)        user.setPhone(req.getPhone());
        if (req.getProfessional() != null) user.setProfessional(req.getProfessional());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse assignCompany(Long userId, AssignCompanyRequest req) {
        User user = findUserById(userId);
        if (req.getCompanyId() != null) {
            Company company = companyService.findCompanyById(req.getCompanyId());
            user.setCompany(company);
            user.getCompanies().add(company);
        } else {
            user.setCompany(null);
        }
        return toResponse(userRepository.save(user));
    }

    public void deactivate(Long id) {
        User user = findUserById(id);
        user.setActive(false);
        userRepository.save(user);
    }

    /**
     * Retorna todas as empresas às quais o usuário está vinculado, ordenadas por nome.
     */
    public List<CompanyResponse> getMyCompanies(User user) {
        return user.getCompanies().stream()
                .sorted(Comparator.comparing(Company::getName))
                .map(c -> CompanyResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .description(c.getDescription())
                        .address(c.getAddress())
                        .phone(c.getPhone())
                        .logoUrl(c.getLogoUrl())
                        .allowClientBooking(c.isAllowClienteBooking())
                        .active(c.isActive())
                        .createdAt(c.getCreatedAt())
                        .build())
                .toList();
    }

    public User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + id));
    }

    private UserResponse toResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .role(u.getRole())
                .professional(u.isProfessional())
                .active(u.isActive())
                .companyId(u.getCompany() != null ? u.getCompany().getId() : null)
                .companyName(u.getCompany() != null ? u.getCompany().getName() : null)
                .createdAt(u.getCreatedAt())
                .build();
    }
}
