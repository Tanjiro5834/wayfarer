package com.nathaniel.travel_guide_app.mapper;

import org.springframework.stereotype.Component;
import com.nathaniel.travel_guide_app.dto.admin_dto.request.EntryRequirementRequest;
import com.nathaniel.travel_guide_app.entity.Country;
import com.nathaniel.travel_guide_app.entity.EntryRequirement;

@Component
public class EntryRequirementMapper {
    public EntryRequirement mapToEntity(EntryRequirement e, EntryRequirementRequest r, Country c) {
        e.setCountry(c);

        // New fields
        e.setVisaType(r.getVisaType());
        e.setMaxStayDays(r.getMaxStayDays());
        e.setPassportValidityRequired(r.getPassportValidityRequired());
        e.setTravelInsurance(r.getTravelInsurance());
        e.setVaccinationRequirements(r.getVaccinationRequirements());
        e.setCustomsNotes(r.getCustomsNotes());
        e.setAdditionalNotes(r.getAdditionalNotes());

        return e;
    }
}
