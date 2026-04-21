package com.nathaniel.travel_guide_app.dto.request.trip;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class TripDayRequest {
    private Long tripId;
    private Integer dayNumber;
    private LocalDate date;
    private String notes;
}