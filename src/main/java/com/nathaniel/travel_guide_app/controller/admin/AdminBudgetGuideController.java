package com.nathaniel.travel_guide_app.controller.admin;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.nathaniel.travel_guide_app.dto.admin_dto.request.BudgetGuideRequest;
import com.nathaniel.travel_guide_app.entity.BudgetGuide;
import com.nathaniel.travel_guide_app.service.BudgetGuideService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/budgets")
@RequiredArgsConstructor
public class AdminBudgetGuideController {

    private final BudgetGuideService budgetGuideService;

    @PostMapping
    public ResponseEntity<BudgetGuide> create(@RequestBody BudgetGuideRequest request) {
        BudgetGuide created = budgetGuideService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{countryId}")
    public ResponseEntity<BudgetGuide> update(
            @PathVariable Long countryId,
            @RequestBody BudgetGuideRequest request) {
        BudgetGuide updated = budgetGuideService.update(countryId, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{countryId}")
    public ResponseEntity<Void> delete(@PathVariable Long countryId) {
        budgetGuideService.delete(countryId);
        return ResponseEntity.noContent().build();
    }
}