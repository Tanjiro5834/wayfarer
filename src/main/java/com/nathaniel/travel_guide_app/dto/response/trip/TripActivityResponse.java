package com.nathaniel.travel_guide_app.dto.response.trip;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
public class TripActivityResponse {
    private Long id;
    private Long tripDayId;
    private Long placeId;       // nullable
    private String placeName;   // nullable
    private String title;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal estimatedCost;
    private Integer sortOrder;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}