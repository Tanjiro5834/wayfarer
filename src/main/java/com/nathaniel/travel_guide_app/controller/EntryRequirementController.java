package com.nathaniel.travel_guide_app.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.nathaniel.travel_guide_app.entity.EntryRequirement;
import com.nathaniel.travel_guide_app.service.EntryRequirementService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/entry-requirements")
@RequiredArgsConstructor
public class EntryRequirementController {
    private final EntryRequirementService entryService;

    @GetMapping("/country/{countryId}")
    public ResponseEntity<EntryRequirement> getByCountry(@PathVariable Long countryId) {
        EntryRequirement data = entryService.getByCountryId(countryId);
        if (data == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(data);
    }
}