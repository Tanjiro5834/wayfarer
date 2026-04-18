package com.nathaniel.travel_guide_app.controller.admin;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.nathaniel.travel_guide_app.dto.admin_dto.request.EntryRequirementRequest;
import com.nathaniel.travel_guide_app.entity.EntryRequirement;
import com.nathaniel.travel_guide_app.service.EntryRequirementService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/entry-requirements")
@RequiredArgsConstructor
public class AdminEntryRequirementController {

    private final EntryRequirementService entryRequirementService;

    @PostMapping
    public ResponseEntity<EntryRequirement> create(@RequestBody EntryRequirementRequest request) {
        EntryRequirement created = entryRequirementService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{countryId}")
    public ResponseEntity<EntryRequirement> update(
            @PathVariable Long countryId,
            @RequestBody EntryRequirementRequest request
    ) {
        EntryRequirement updated = entryRequirementService.update(countryId, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{countryId}")
    public ResponseEntity<Void> delete(@PathVariable Long countryId) {
        entryRequirementService.delete(countryId);
        return ResponseEntity.noContent().build();
    }
}