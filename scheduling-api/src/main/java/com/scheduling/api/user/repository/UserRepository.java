package com.scheduling.api.user.repository;

import com.scheduling.api.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /** ADMIN/MANAGER vinculados à empresa via user_companies. */
    @Query("SELECT u FROM User u JOIN u.companies c WHERE c.id = :companyId AND u.role IN ('ADMIN', 'MANAGER')")
    List<User> findStaffByCompanyId(@Param("companyId") Long companyId);

    /** CLIENTs que já tiveram ao menos um agendamento na empresa. */
    @Query("SELECT DISTINCT u FROM User u WHERE u.role = 'CLIENT' AND u.id IN " +
           "(SELECT a.client.id FROM Appointment a WHERE a.company.id = :companyId)")
    List<User> findClientsByCompanyId(@Param("companyId") Long companyId);

    /** Notificações: ADMIN/MANAGER ativos vinculados à empresa. */
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN u.companies c WHERE u.active = true AND " +
           "(u.role = 'ADMIN' OR (u.role = 'MANAGER' AND c.id = :companyId))")
    List<User> findActiveStaffForCompany(@Param("companyId") Long companyId);

    /** Profissionais de atendimento: MANAGER com professional=true OU role=PROFESSIONAL, vinculados à empresa. */
    @Query("SELECT u FROM User u JOIN u.companies c WHERE c.id = :companyId " +
           "AND (u.professional = true OR u.role = 'PROFESSIONAL') " +
           "AND u.active = true ORDER BY u.name")
    List<User> findProfessionalsByCompanyId(@Param("companyId") Long companyId);
}
