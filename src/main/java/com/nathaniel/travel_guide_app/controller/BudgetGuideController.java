package com.nathaniel.travel_guide_app.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.nathaniel.travel_guide_app.entity.BudgetGuide;
import com.nathaniel.travel_guide_app.service.BudgetGuideService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetGuideController {
    private final BudgetGuideService budgetService;

    @GetMapping("/country/{countryId}")
    public ResponseEntity<BudgetGuide> getByCountry(@PathVariable Long countryId) {
        BudgetGuide data = budgetService.getByCountryId(countryId);
        if (data == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(data);
    }

    @GetMapping("/test")
    public String test() {
        return "BUDGET OK";
    }
}