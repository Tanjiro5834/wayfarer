package com.nathaniel.travel_guide_app.mapper;

import org.springframework.stereotype.Component;
import com.nathaniel.travel_guide_app.dto.request.trip.TripActivityRequest;
import com.nathaniel.travel_guide_app.dto.response.trip.TripActivityResponse;
import com.nathaniel.travel_guide_app.entity.Place;
import com.nathaniel.travel_guide_app.entity.TripActivity;
import com.nathaniel.travel_guide_app.entity.TripDay;

@Component
public class TripActivityMapper {

    public TripActivity toEntity(TripActivityRequest request, TripDay tripDay, Place place) {
        TripActivity activity = new TripActivity();
        activity.setTripDay(tripDay);
        activity.setPlace(place); // nullable
        activity.setTitle(request.getTitle());
        activity.setStartTime(request.getStartTime());
        activity.setEndTime(request.getEndTime());
        activity.setEstimatedCost(request.getEstimatedCost());
        activity.setSortOrder(request.getSortOrder());
        activity.setNotes(request.getNotes());
        return activity;
    }

    public TripActivityResponse toResponse(TripActivity activity) {
        TripActivityResponse response = new TripActivityResponse();
        response.setId(activity.getId());
        response.setTripDayId(activity.getTripDay().getId());
        response.setPlaceId(activity.getPlace() != null ? activity.getPlace().getId() : null);
        response.setPlaceName(activity.getPlace() != null ? activity.getPlace().getName() : null);
        response.setTitle(activity.getTitle());
        response.setStartTime(activity.getStartTime());
        response.setEndTime(activity.getEndTime());
        response.setEstimatedCost(activity.getEstimatedCost());
        response.setSortOrder(activity.getSortOrder());
        response.setNotes(activity.getNotes());
        response.setCreatedAt(activity.getCreatedAt());
        response.setUpdatedAt(activity.getUpdatedAt());
        return response;
    }

    public void updateEntity(TripActivity activity, TripActivityRequest request, TripDay tripDay, Place place) {
        activity.setTripDay(tripDay);
        activity.setPlace(place); // nullable
        activity.setTitle(request.getTitle());
        activity.setStartTime(request.getStartTime());
        activity.setEndTime(request.getEndTime());
        activity.setEstimatedCost(request.getEstimatedCost());
        activity.setSortOrder(request.getSortOrder());
        activity.setNotes(request.getNotes());
    }
}