package com.scheduling.api.scheduling.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ScheduleBlockRequest {

    @NotNull
    private Long companyId;

    @NotNull
    private LocalDateTime startAt;

    @NotNull
    private LocalDateTime endAt;

    private String reason;

    /** Null = bloqueia para todos os profissionais da empresa. */
    private Long professionalId;
}