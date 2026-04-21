package com.nathaniel.travel_guide_app.mapper;

import org.springframework.stereotype.Component;
import com.nathaniel.travel_guide_app.dto.request.trip.TripRequest;
import com.nathaniel.travel_guide_app.dto.response.trip.TripResponse;
import com.nathaniel.travel_guide_app.entity.Destination;
import com.nathaniel.travel_guide_app.entity.Trip;
import com.nathaniel.travel_guide_app.enums.TripStatus;

@Component
public class TripMapper {

    public Trip toEntity(TripRequest request, Destination destination) {
        Trip trip = new Trip();
        trip.setUserId(request.getUserId());
        trip.setDestination(destination);
        trip.setTitle(request.getTitle());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setTotalBudget(request.getTotalBudget());
        trip.setTravelStyle(request.getTravelStyle());
        trip.setStatus(request.getStatus() != null ? request.getStatus() : TripStatus.DRAFT);
        trip.setNotes(request.getNotes());
        return trip;
    }

    public TripResponse toResponse(Trip trip) {
        TripResponse response = new TripResponse();
        response.setId(trip.getId());
        response.setUserId(trip.getUserId());
        response.setDestinationId(trip.getDestination().getId());
        response.setDestinationName(trip.getDestination().getName());
        response.setTitle(trip.getTitle());
        response.setStartDate(trip.getStartDate());
        response.setEndDate(trip.getEndDate());
        response.setTotalBudget(trip.getTotalBudget());
        response.setTravelStyle(trip.getTravelStyle());
        response.setStatus(trip.getStatus());
        response.setNotes(trip.getNotes());
        response.setCreatedAt(trip.getCreatedAt());
        response.setUpdatedAt(trip.getUpdatedAt());
        return response;
    }

    public void updateEntity(Trip trip, TripRequest request, Destination destination) {
        trip.setDestination(destination);
        trip.setTitle(request.getTitle());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setTotalBudget(request.getTotalBudget());
        trip.setTravelStyle(request.getTravelStyle());
        if (request.getStatus() != null) trip.setStatus(request.getStatus());
        trip.setNotes(request.getNotes());
    }
}