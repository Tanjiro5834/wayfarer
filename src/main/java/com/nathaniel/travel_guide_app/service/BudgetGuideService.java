package com.nathaniel.travel_guide_app.service;

import org.springframework.stereotype.Service;
import com.nathaniel.travel_guide_app.dto.admin_dto.request.BudgetGuideRequest;
import com.nathaniel.travel_guide_app.entity.BudgetGuide;
import com.nathaniel.travel_guide_app.entity.Country;
import com.nathaniel.travel_guide_app.repository.BudgetGuideRepository;
import com.nathaniel.travel_guide_app.repository.CountryRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BudgetGuideService {
    private final BudgetGuideRepository budgetGuideRepository;
    private final CountryRepository countryRepository;

    public BudgetGuide getByCountryId(Long countryId){
        return budgetGuideRepository.findByCountryId(countryId)
        .orElse(null);
    }

    public BudgetGuide create(BudgetGuideRequest request) {
        if (budgetGuideRepository.findByCountryId(request.getCountryId()).isPresent()) {
            throw new RuntimeException("Budget guide already exists for this country");
        }

        Country country = countryRepository.findById(request.getCountryId())
            .orElseThrow(() -> new RuntimeException("Country not found"));

        BudgetGuide guide = new BudgetGuide();
        guide.setCountry(country);
        guide.setBudgetDaily(request.getBudgetDaily());
        guide.setMidRangeDaily(request.getMidRangeDaily());
        guide.setLuxuryDaily(request.getLuxuryDaily());
        guide.setAverageHotelCost(request.getAverageHotelCost());
        guide.setAverageMealCost(request.getAverageMealCost());
        guide.setAverageTransportCost(request.getAverageTransportCost());
        guide.setCurrency(request.getCurrency());

        return budgetGuideRepository.save(guide);
    }

    @Transactional
    public BudgetGuide update(Long countryId, BudgetGuideRequest request) {
        BudgetGuide guide = budgetGuideRepository.findByCountryId(countryId)
            .orElseThrow(() -> new RuntimeException("Budget guide not found"));

        guide.setBudgetDaily(request.getBudgetDaily());
        guide.setMidRangeDaily(request.getMidRangeDaily());
        guide.setLuxuryDaily(request.getLuxuryDaily());
        guide.setAverageHotelCost(request.getAverageHotelCost());
        guide.setAverageMealCost(request.getAverageMealCost());
        guide.setAverageTransportCost(request.getAverageTransportCost());
        guide.setCurrency(request.getCurrency());

        return budgetGuideRepository.save(guide);
    }

    @Transactional
    public void delete(Long countryId) {
        BudgetGuide guide = budgetGuideRepository.findByCountryId(countryId)
            .orElseThrow(() -> new RuntimeException("Budget guide not found"));

        budgetGuideRepository.delete(guide);
    }
}
