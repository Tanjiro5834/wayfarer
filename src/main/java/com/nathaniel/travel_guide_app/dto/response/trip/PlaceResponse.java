package com.nathaniel.travel_guide_app.dto.response.trip;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class PlaceResponse {
    private Long id;
    private Long destinationId;
    private String destinationName;
    private Long categoryId;
    private String categoryName;
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}