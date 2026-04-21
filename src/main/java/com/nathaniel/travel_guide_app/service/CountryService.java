package com.nathaniel.travel_guide_app.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.nathaniel.travel_guide_app.dto.admin_dto.request.CreateCountryRequest;
import com.nathaniel.travel_guide_app.dto.admin_dto.request.UpdateCountryRequest;
import com.nathaniel.travel_guide_app.dto.admin_dto.response.AdminCountryResponse;
import com.nathaniel.travel_guide_app.dto.response.CountryDetailResponse;
import com.nathaniel.travel_guide_app.dto.response.CountryResponse;
import com.nathaniel.travel_guide_app.entity.Country;
import com.nathaniel.travel_guide_app.mapper.CountryMapper;
import com.nathaniel.travel_guide_app.repository.CountryRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CountryService {

    private final CountryRepository countryRepository;
    private final CountryMapper countryMapper;

    public List<CountryResponse> getAllCountries() {
        return countryRepository.findAll()
                .stream()
                .map(countryMapper::mapToResponse)
                .collect(Collectors.toList());
    }

    public AdminCountryResponse getAdminCountryById(Long id) {
        Country country = countryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Country not found with ID: " + id));

        return countryMapper.mapToAdminResponse(country);
    }

    public Country getCountryById(Long id) {
        return countryRepository.findById(id).orElse(null);
    }

    public Country getCountryBySlug(String slug) {
        return countryRepository.findBySlug(slug).orElse(null);
    }

    public List<Country> searchCountries(String keyword) {
        return countryRepository.findByNameContainingIgnoreCase(keyword);
    }

    public Country getPopularCountry() {
        return countryRepository.findFirstByOrderByViewCountDesc()
                .orElseThrow(() -> new RuntimeException("No countries found"));
    }

    @Transactional
    public CountryResponse createCountry(CreateCountryRequest request) {
        if (countryRepository.findByName(request.getName()).isPresent()) {
            throw new RuntimeException("Country already exists");
        }

        Country country = new Country();
        country.setName(request.getName());
        country.setSlug(generateUniqueSlug(request.getName(), null));
        country.setRegion(request.getRegion());
        country.setSubRegion(request.getSubRegion());
        country.setCode(request.getCode());
        country.setCapital(request.getCapital());
        country.setCurrency(request.getCurrency());
        country.setLanguage(request.getLanguage());
        country.setTimeZone(request.getTimeZone());
        country.setBestTimeToVisit(request.getBestTimeToVisit());
        country.setSafetyLevel(request.getSafetyLevel());
        country.setFlagUrl(request.getFlagUrl());
        country.setOverview(request.getOverview());
        country.setUpdatedAt(LocalDateTime.now());

        Country saved = countryRepository.save(country);
        return countryMapper.mapToResponse(saved);
    }

    @Transactional
    public CountryResponse updateCountry(Long id, UpdateCountryRequest request) {
        Country country = countryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Country not found"));

        country.setName(request.getName());
        country.setSlug(generateUniqueSlug(request.getName(), country.getId()));
        country.setRegion(request.getRegion());
        country.setSubRegion(request.getSubRegion());
        country.setCode(request.getCode());
        country.setCapital(request.getCapital());
        country.setCurrency(request.getCurrency());
        country.setLanguage(request.getLanguage());
        country.setTimeZone(request.getTimeZone());
        country.setBestTimeToVisit(request.getBestTimeToVisit());
        country.setSafetyLevel(request.getSafetyLevel());
        country.setFlagUrl(request.getFlagUrl());
        country.setOverview(request.getOverview());
        country.setUpdatedAt(LocalDateTime.now());

        Country updated = countryRepository.save(country);
        return countryMapper.mapToResponse(updated);
    }

    public void deleteCountry(Long id) {
        if (!countryRepository.existsById(id)) {
            throw new RuntimeException("Country not found");
        }
        countryRepository.deleteById(id);
    }

    public CountryResponse getCountryByIdAndIncrementView(Long id) {
        Country country = countryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Country not found with ID: " + id));

        country.setViewCount(country.getViewCount() + 1);
        country.setUpdatedAt(country.getUpdatedAt());
        Country saved = countryRepository.save(country);

        return countryMapper.mapToResponse(saved);
    }

    public CountryDetailResponse getCountryDetailById(Long id) {
        Country country = countryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Country not found with ID: " + id));

        return countryMapper.mapToDetailResponse(country);
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }

    private String generateUniqueSlug(String name, Long currentCountryId) {
        String baseSlug = generateSlug(name);
        String slug = baseSlug;
        int counter = 1;

        while (true) {
            var existing = countryRepository.findBySlug(slug);

            if (existing.isEmpty()) {
                return slug;
            }

            if (currentCountryId != null && existing.get().getId().equals(currentCountryId)) {
                return slug;
            }

            slug = baseSlug + "-" + counter++;
        }
    }
}