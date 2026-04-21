package com.nathaniel.travel_guide_app.dto.response.trip;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import com.nathaniel.travel_guide_app.enums.DestinationType;

@Getter
@Setter
public class DestinationResponse {
    private Long id;
    private String name;
    private DestinationType type;
    private String description;
    private Boolean isPublished;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}