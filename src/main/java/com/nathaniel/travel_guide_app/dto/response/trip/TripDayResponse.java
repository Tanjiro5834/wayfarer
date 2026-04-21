package com.nathaniel.travel_guide_app.dto.response.trip;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class TripDayResponse {
    private Long id;
    private Long tripId;
    private Integer dayNumber;
    private LocalDate date;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
