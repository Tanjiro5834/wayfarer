package com.nathaniel.travel_guide_app.dto.response.trip;


import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.nathaniel.travel_guide_app.enums.TravelStyle;
import com.nathaniel.travel_guide_app.enums.TripStatus;

@Getter
@Setter
public class TripResponse {
    private Long id;
    private Long userId;
    private Long countryId;
    private String countryName;
    private String title;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer numberOfDays;
    private Integer peopleCount;
    private String representativeName;
    private BigDecimal totalBudget;
    private TravelStyle travelStyle;
    private TripStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
