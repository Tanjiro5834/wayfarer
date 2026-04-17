package com.nathaniel.travel_guide_app.service.admin_service;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import com.nathaniel.travel_guide_app.dto.admin_dto.response.AdminActivityResponse;
import com.nathaniel.travel_guide_app.entity.Country;
import com.nathaniel.travel_guide_app.repository.CountryRepository;
import com.nathaniel.travel_guide_app.service.admin_service.interfaces.AdminActivityService;

@Service
public class AdminActivityServiceImpl implements AdminActivityService {
    private final CountryRepository countryRepository;

    public AdminActivityServiceImpl(CountryRepository countryRepository) {
        this.countryRepository = countryRepository;
    }

    @Override
    public List<AdminActivityResponse> getRecentActivity() {
        List<AdminActivityResponse> results = new ArrayList<>();
        List<Country> countries = countryRepository.findTop5ByOrderByUpdatedAtDesc();

        for (Country country : countries) {
            AdminActivityResponse item = new AdminActivityResponse();
            item.setTitle(country.getName() + " updated");
            item.setDescription("Country content was recently modified in the admin system.");
            item.setStatus("Saved");
            results.add(item);
        }

        return results;
    }
}
