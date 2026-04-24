package com.nathaniel.travel_guide_app.dto.request.trip;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.nathaniel.travel_guide_app.enums.TravelStyle;
import com.nathaniel.travel_guide_app.enums.TripStatus;

@Getter
@Setter
public class TripRequest {
    private Long userId;
    private Long countryId;
    private String title;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer numberOfDays;          // ✅ NEW
    private Integer peopleCount;           // ✅ NEW
    private String representativeName;   // ✅ NEW
    private BigDecimal totalBudget;
    private TravelStyle travelStyle;
    private TripStatus status;
    private String notes;

}