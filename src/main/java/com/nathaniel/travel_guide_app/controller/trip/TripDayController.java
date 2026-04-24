package com.nathaniel.travel_guide_app.controller.trip;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.nathaniel.travel_guide_app.dto.response.trip.TripDayResponse;
import com.nathaniel.travel_guide_app.service.trip.TripDayService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/trip-days")
@RequiredArgsConstructor
public class TripDayController {

    private final TripDayService tripDayService;

    @GetMapping("/trip/{tripId}")
    public List<TripDayResponse> getByTrip(@PathVariable Long tripId) {
        return tripDayService.getResponsesByTripId(tripId);
    }
}