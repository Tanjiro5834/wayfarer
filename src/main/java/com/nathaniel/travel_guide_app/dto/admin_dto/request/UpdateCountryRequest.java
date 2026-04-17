package com.nathaniel.travel_guide_app.dto.admin_dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCountryRequest {
    private String name;
    private String region;
    private String flagEmoji;
    private String status;
}