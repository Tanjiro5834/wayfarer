package com.nathaniel.travel_guide_app.mapper;

import org.springframework.stereotype.Component;

import com.nathaniel.travel_guide_app.dto.request.trip.TripRequest;
import com.nathaniel.travel_guide_app.dto.response.trip.TripResponse;
import com.nathaniel.travel_guide_app.entity.Country;
import com.nathaniel.travel_guide_app.entity.Trip;
import com.nathaniel.travel_guide_app.enums.TripStatus;

@Component
public class TripMapper {

    public Trip toEntity(TripRequest request, Country country) {
        Trip trip = new Trip();

        trip.setUserId(request.getUserId());
        trip.setCountry(country);
        trip.setTitle(request.getTitle());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());

        trip.setNumberOfDays(request.getNumberOfDays());
        trip.setPeopleCount(request.getPeopleCount());
        trip.setRepresentativeName(request.getRepresentativeName());

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

        response.setCountryId(trip.getCountry().getId());
        response.setCountryName(trip.getCountry().getName());

        response.setTitle(trip.getTitle());
        response.setStartDate(trip.getStartDate());
        response.setEndDate(trip.getEndDate());

        response.setNumberOfDays(trip.getNumberOfDays());
        response.setPeopleCount(trip.getPeopleCount());
        response.setRepresentativeName(trip.getRepresentativeName());

        response.setTotalBudget(trip.getTotalBudget());
        response.setTravelStyle(trip.getTravelStyle());
        response.setStatus(trip.getStatus());
        response.setNotes(trip.getNotes());
        response.setCreatedAt(trip.getCreatedAt());
        response.setUpdatedAt(trip.getUpdatedAt());

        return response;
    }

    public void updateEntity(Trip trip, TripRequest request, Country country) {
        trip.setCountry(country);
        trip.setTitle(request.getTitle());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());

        trip.setNumberOfDays(request.getNumberOfDays());
        trip.setPeopleCount(request.getPeopleCount());
        trip.setRepresentativeName(request.getRepresentativeName());

        trip.setTotalBudget(request.getTotalBudget());
        trip.setTravelStyle(request.getTravelStyle());

        if (request.getStatus() != null) {
            trip.setStatus(request.getStatus());
        }

        trip.setNotes(request.getNotes());
    }
}