package com.nathaniel.travel_guide_app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.nathaniel.travel_guide_app.enums.TravelStyle;
import com.nathaniel.travel_guide_app.enums.TripStatus;

@Entity
@Table(name = "trips")
@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_id", nullable = false)
    private Country country;

    @Column(nullable = false)
    private String title;

    private LocalDate startDate;
    private LocalDate endDate;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalBudget;

    @Enumerated(EnumType.STRING)
    private TravelStyle travelStyle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TripStatus status = TripStatus.DRAFT;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<TripDay> tripDays = new ArrayList<>();

    @Column(nullable = false)
    private Integer numberOfDays;

    private Integer peopleCount;

    private String representativeName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}