package com.nathaniel.travel_guide_app.dto.request.trip;

import com.nathaniel.travel_guide_app.enums.DestinationType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DestinationRequest {
    private String name;
    private DestinationType type;
    private String description;
    private Boolean isPublished;
}