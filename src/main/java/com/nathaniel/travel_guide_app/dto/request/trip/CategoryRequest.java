package com.nathaniel.travel_guide_app.dto.request.trip;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryRequest {
    private String name;
    private String description;
}