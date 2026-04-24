package com.nathaniel.travel_guide_app.mapper;

import org.springframework.stereotype.Component;

import com.nathaniel.travel_guide_app.dto.request.trip.PlaceRequest;
import com.nathaniel.travel_guide_app.dto.response.trip.PlaceResponse;
import com.nathaniel.travel_guide_app.entity.Category;
import com.nathaniel.travel_guide_app.entity.Country;
import com.nathaniel.travel_guide_app.entity.Place;

@Component
public class PlaceMapper {

    public Place toEntity(PlaceRequest request, Country country, Category category) {
        Place place = new Place();

        place.setCountry(country);
        place.setCategory(category);
        place.setName(request.getName());
        place.setDescription(request.getDescription());
        place.setAddress(request.getAddress());
        place.setLatitude(request.getLatitude());
        place.setLongitude(request.getLongitude());
        place.setEstimatedCost(request.getEstimatedCost());
        place.setRecommendedDurationMinutes(request.getRecommendedDurationMinutes());
        place.setOpeningHours(request.getOpeningHours());
        place.setContactInfo(request.getContactInfo());
        place.setIsFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false);
        place.setIsPublished(request.getIsPublished() != null ? request.getIsPublished() : false);

        return place;
    }

    public PlaceResponse toResponse(Place place) {
        PlaceResponse response = new PlaceResponse();

        response.setId(place.getId());
        response.setCountryId(place.getCountry().getId());
        response.setCountryName(place.getCountry().getName());
        response.setCategoryId(place.getCategory().getId());
        response.setCategoryName(place.getCategory().getName());
        response.setName(place.getName());
        response.setDescription(place.getDescription());
        response.setAddress(place.getAddress());
        response.setLatitude(place.getLatitude());
        response.setLongitude(place.getLongitude());
        response.setEstimatedCost(place.getEstimatedCost());
        response.setRecommendedDurationMinutes(place.getRecommendedDurationMinutes());
        response.setOpeningHours(place.getOpeningHours());
        response.setContactInfo(place.getContactInfo());
        response.setIsFeatured(place.getIsFeatured());
        response.setIsPublished(place.getIsPublished());
        response.setCreatedAt(place.getCreatedAt());
        response.setUpdatedAt(place.getUpdatedAt());

        return response;
    }

    public void updateEntity(Place place, PlaceRequest request, Country country, Category category) {
        place.setCountry(country);
        place.setCategory(category);
        place.setName(request.getName());
        place.setDescription(request.getDescription());
        place.setAddress(request.getAddress());
        place.setLatitude(request.getLatitude());
        place.setLongitude(request.getLongitude());
        place.setEstimatedCost(request.getEstimatedCost());
        place.setRecommendedDurationMinutes(request.getRecommendedDurationMinutes());
        place.setOpeningHours(request.getOpeningHours());
        place.setContactInfo(request.getContactInfo());

        if (request.getIsFeatured() != null) {
            place.setIsFeatured(request.getIsFeatured());
        }

        if (request.getIsPublished() != null) {
            place.setIsPublished(request.getIsPublished());
        }
    }
}