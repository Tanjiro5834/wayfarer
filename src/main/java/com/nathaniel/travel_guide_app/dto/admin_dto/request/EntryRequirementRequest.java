package com.nathaniel.travel_guide_app.dto.admin_dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EntryRequirementRequest {
    private Long countryId;
    private String visaType;
    private Integer maxStayDays;
    private String passportValidityRequired;
    private String vaccinationRequirements;
    private String travelInsurance;
    private String customsNotes;
    private String additionalNotes;
}