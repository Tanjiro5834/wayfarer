package com.nathaniel.travel_guide_app.dto.request.trip;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalTime;

@Getter
@Setter
public class TripActivityRequest {
    private Long tripDayId;
    private Long placeId; // nullable
    private String title;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal estimatedCost;
    private Integer sortOrder;
    private String notes;
}