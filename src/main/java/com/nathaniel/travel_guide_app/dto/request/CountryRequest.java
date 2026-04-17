package com.nathaniel.travel_guide_app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CountryRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @Size(max = 3, message = "Code must be up to 3 characters (e.g., JPN)")
    private String code;

    private String region; // Matches Response
    private String capital;
    private String currency;
    private String language;
    private String timeZone;
    private String bestTimeToVisit;
    private String safetyLevel;
    private String flagUrl;
    private String flagEmoji; // Matches Response
    private String overview;
}
