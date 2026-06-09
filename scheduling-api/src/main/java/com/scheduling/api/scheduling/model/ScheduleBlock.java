package com.scheduling.api.scheduling.model;

import com.scheduling.api.company.model.Company;
import com.scheduling.api.user.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "schedule_blocks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne
    @JoinColumn(name = "professional_id")
    private User professional;

    private LocalDateTime startAt;

    private LocalDateTime endAt;

    private String reason;

}
