package com.nathaniel.travel_guide_app.service.admin_service;

import org.springframework.stereotype.Service;
import com.nathaniel.travel_guide_app.dto.admin_dto.response.AdminDashboardResponse;
import com.nathaniel.travel_guide_app.repository.CountryRepository;
import com.nathaniel.travel_guide_app.repository.SavedDestinationRepository;
import com.nathaniel.travel_guide_app.service.admin_service.interfaces.AdminDashboardService;

@Service
public class AdminDashboardServiceImpl implements AdminDashboardService{
    private final CountryRepository countryRepository;
    private final SavedDestinationRepository savedDestinationRepository;
    
    public AdminDashboardServiceImpl(CountryRepository countryRepository, SavedDestinationRepository savedDestinationRepository) {
        this.countryRepository = countryRepository;
        this.savedDestinationRepository = savedDestinationRepository;
    }

    @Override
    public AdminDashboardResponse getDashboardSummary() {
        AdminDashboardResponse response = new AdminDashboardResponse();

        response.setTotalCountries(countryRepository.count());
        // Replace these when you add real published/draft fields
        response.setPublishedGuides(countryRepository.count());
        response.setDraftUpdates(0);
        response.setTotalSaves(savedDestinationRepository.count());

        return response;
    }
}