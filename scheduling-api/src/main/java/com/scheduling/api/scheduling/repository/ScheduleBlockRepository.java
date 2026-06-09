package com.scheduling.api.scheduling.repository;

import com.scheduling.api.scheduling.model.ScheduleBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface ScheduleBlockRepository extends JpaRepository<ScheduleBlock, Long> {

    List<ScheduleBlock> findByCompanyId(Long companyId);

    /** Bloqueios de um profissional específico + bloqueios globais (professional=null) da empresa. */
    @Query("SELECT b FROM ScheduleBlock b WHERE b.company.id = :companyId " +
           "AND (b.professional.id = :professionalId OR b.professional IS NULL)")
    List<ScheduleBlock> findByCompanyIdAndProfessionalIdOrNull(
            @org.springframework.data.repository.query.Param("companyId") Long companyId,
            @org.springframework.data.repository.query.Param("professionalId") Long professionalId);

    @Query("SELECT b FROM ScheduleBlock b WHERE b.company.id = :companyId " +
            "AND b.startAt <= :end AND b.endAt >= :start")
    List<ScheduleBlock> findOverLapping(Long companyId, LocalDateTime start, LocalDateTime end);
}