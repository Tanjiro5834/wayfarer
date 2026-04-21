package com.nathaniel.travel_guide_app.mapper;

import org.springframework.stereotype.Component;
import com.nathaniel.travel_guide_app.dto.request.trip.DestinationRequest;
import com.nathaniel.travel_guide_app.dto.response.trip.DestinationResponse;
import com.nathaniel.travel_guide_app.entity.Destination;

@Component
public class DestinationMapper {

    public Destination toEntity(DestinationRequest request) {
        Destination destination = new Destination();
        destination.setName(request.getName());
        destination.setType(request.getType());
        destination.setDescription(request.getDescription());
        destination.setIsPublished(request.getIsPublished() != null ? request.getIsPublished() : false);
        return destination;
    }

    public DestinationResponse toResponse(Destination destination) {
        DestinationResponse response = new DestinationResponse();
        response.setId(destination.getId());
        response.setName(destination.getName());
        response.setType(destination.getType());
        response.setDescription(destination.getDescription());
        response.setIsPublished(destination.getIsPublished());
        response.setCreatedAt(destination.getCreatedAt());
        response.setUpdatedAt(destination.getUpdatedAt());
        return response;
    }

    public void updateEntity(Destination destination, DestinationRequest request) {
        destination.setName(request.getName());
        destination.setType(request.getType());
        destination.setDescription(request.getDescription());
        if (request.getIsPublished() != null) destination.setIsPublished(request.getIsPublished());
    }
}