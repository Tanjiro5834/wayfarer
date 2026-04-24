package com.nathaniel.travel_guide_app.controller.trip;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.nathaniel.travel_guide_app.dto.request.trip.TripRequest;
import com.nathaniel.travel_guide_app.dto.response.trip.TripResponse;
import com.nathaniel.travel_guide_app.entity.Trip;
import com.nathaniel.travel_guide_app.enums.TripStatus;
import com.nathaniel.travel_guide_app.service.trip.TripService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @PostMapping
    public TripResponse createTrip(@RequestBody TripRequest request) {
        return tripService.createTrip(request);
    }

    // ✅ Main endpoint for your planner flow
    @PostMapping("/generate")
    public TripResponse generateTrip(@RequestBody TripRequest request) {
        return tripService.generateTrip(request);
    }

    @GetMapping("/{id}")
    public TripResponse getById(@PathVariable Long id) {
        return tripService.getResponseById(id);
    }

    @GetMapping("/user/{userId}")
    public List<Trip> getByUser(@PathVariable Long userId) {
        return tripService.getByUser(userId);
    }

    @GetMapping("/user/{userId}/status/{status}")
    public List<Trip> getByUserAndStatus(
            @PathVariable Long userId,
            @PathVariable TripStatus status
    ) {
        return tripService.getByUserAndStatus(userId, status);
    }

    @GetMapping("/me")
    public List<Trip> getMyTrips() {
        return tripService.getByUser(1L); // temp until auth
    }

    @PutMapping("/{id}")
    public TripResponse updateTrip(
            @PathVariable Long id,
            @RequestBody TripRequest request
    ) {
        return tripService.updateTrip(id, request);
    }

    @PatchMapping("/{id}/status")
    public TripResponse updateStatus(
            @PathVariable Long id,
            @RequestParam TripStatus status
    ) {
        return tripService.updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public void deleteTrip(@PathVariable Long id) {
        tripService.deleteTrip(id);
    }
}