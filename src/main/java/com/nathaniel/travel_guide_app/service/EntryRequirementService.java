package com.nathaniel.travel_guide_app.service;

import org.springframework.stereotype.Service;
import com.nathaniel.travel_guide_app.dto.admin_dto.request.EntryRequirementRequest;
import com.nathaniel.travel_guide_app.entity.Country;
import com.nathaniel.travel_guide_app.entity.EntryRequirement;
import com.nathaniel.travel_guide_app.mapper.EntryRequirementMapper;
import com.nathaniel.travel_guide_app.repository.CountryRepository;
import com.nathaniel.travel_guide_app.repository.EntryRequirementRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EntryRequirementService {

    private final EntryRequirementRepository entryRequirementRepository;
    private final CountryRepository countryRepository;
    private final EntryRequirementMapper entryRequirementMapper;

    public EntryRequirement getByCountryId(Long countryId) {
        return entryRequirementRepository.findByCountryId(countryId).orElse(null);
    }

    @Transactional
    public EntryRequirement create(EntryRequirementRequest request) {
        if (entryRequirementRepository.existsByCountryId(request.getCountryId())) {
            throw new RuntimeException("Entry requirement already exists");
        }

        Country country = countryRepository.findById(request.getCountryId())
                .orElseThrow(() -> new RuntimeException("Country not found"));

        EntryRequirement entryRequirement = new EntryRequirement();
        entryRequirementMapper.mapToEntity(entryRequirement, request, country);

        return entryRequirementRepository.save(entryRequirement);
    }

    @Transactional
    public EntryRequirement update(Long countryId, EntryRequirementRequest request) {
        EntryRequirement entryRequirement = entryRequirementRepository.findByCountryId(countryId)
                .orElseThrow(() -> new RuntimeException("Entry requirement not found"));

        entryRequirementMapper.mapToEntity(entryRequirement, request, entryRequirement.getCountry());

        return entryRequirementRepository.save(entryRequirement);
    }

    @Transactional
    public void delete(Long countryId) {
        EntryRequirement entryRequirement = entryRequirementRepository.findByCountryId(countryId)
                .orElseThrow(() -> new RuntimeException("Entry requirement not found"));

        entryRequirementRepository.delete(entryRequirement);
    }
}