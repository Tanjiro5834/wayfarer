package com.nathaniel.travel_guide_app.dto.request.trip;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PlaceRequest {
    private Long destinationId;
    private Long categoryId;
    private String name;
    private String description;
    private String address;
    private Double latitude;
    private Double longitude;
    private BigDecimal estimatedCost;
    private Integer recommendedDurationMinutes;
    private String openingHours;
    private String contactInfo;
    private Boolean isFeatured;
    private Boolean isPublished;
}