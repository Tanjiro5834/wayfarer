package com.nathaniel.travel_guide_app.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import com.nathaniel.travel_guide_app.dto.DTOs.PackingCategoryDTO;
import com.nathaniel.travel_guide_app.dto.request.PackingChecklistItemRequest;
import com.nathaniel.travel_guide_app.dto.response.PackingChecklistItemResponse;
import com.nathaniel.travel_guide_app.entity.Country;
import com.nathaniel.travel_guide_app.entity.PackingChecklistItem;
import com.nathaniel.travel_guide_app.mapper.PackingChecklistItemMapper;
import com.nathaniel.travel_guide_app.repository.CountryRepository;
import com.nathaniel.travel_guide_app.repository.PackingChecklistItemRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PackingChecklistService {
    private final PackingChecklistItemRepository packingChecklistItemRepository;
    private final CountryRepository countryRepository;
    private final PackingChecklistItemMapper packingChecklistItemMapper;

    public List<PackingChecklistItem> getByCountryId(Long countryId){
        return packingChecklistItemRepository.findByCountryIdOrderByCategoryAscItemNameAsc(countryId);
    }

    public List<PackingCategoryDTO> getGroupedByCategory(Long countryId){
        return packingChecklistItemRepository.findByCountryIdOrderByCategoryAscItemNameAsc(countryId)
        .stream()
        .collect(Collectors.groupingBy(PackingChecklistItem::getCategory))
        .entrySet().stream()
        .map(entry -> {
            PackingCategoryDTO dto = new PackingCategoryDTO();
            dto.setCategory(entry.getKey());
            dto.setItems(entry.getValue());
            return dto;
        })
        .collect(Collectors.toList());
    }

    @Transactional
    public PackingChecklistItemResponse createChecklistItem(PackingChecklistItemRequest request){
        if(packingChecklistItemRepository.existsById(request.getCountryId())){
            throw new RuntimeException("Packing Checklist already exist");
        }

        Country country = countryRepository.findById(request.getCountryId())
        .orElseThrow(() -> new RuntimeException("Country not found"));

        PackingChecklistItem checklistItem = new PackingChecklistItem();
        checklistItem.setCountry(country);
        checklistItem.setCategory(request.getCategory());
        checklistItem.setItemName(request.getItemName());
        checklistItem.setEssential(request.getEssential());
        checklistItem.setNote(request.getNote());

        PackingChecklistItem saved = packingChecklistItemRepository.save(checklistItem);
        return packingChecklistItemMapper.mapToResponse(saved);
    }

    @Transactional
    public PackingChecklistItemResponse updateChecklistItem(Long id, PackingChecklistItemRequest request){
        PackingChecklistItem existingItem = packingChecklistItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Packing checklist item not found with id: " + id));
        
        // Update country if needed (check if countryId changed and is valid)
        if (request.getCountryId() != null && 
        !existingItem.getCountry().getId().equals(request.getCountryId())) {
            Country country = countryRepository.findById(request.getCountryId())
            .orElseThrow(() -> new RuntimeException("Country not found with id: " + request.getCountryId()));
            existingItem.setCountry(country);
        }
        
        if (request.getCategory() != null) {
            existingItem.setCategory(request.getCategory());
        }
        if (request.getItemName() != null) {
            existingItem.setItemName(request.getItemName());
        }
        if (request.getEssential() != null) {
            existingItem.setEssential(request.getEssential());
        }
        if (request.getNote() != null) {
            existingItem.setNote(request.getNote());
        }
        
        PackingChecklistItem updated = packingChecklistItemRepository.save(existingItem);
        return packingChecklistItemMapper.mapToResponse(updated);
    }

    @Transactional
    public void deleteChecklistItem(Long id){
        if (!packingChecklistItemRepository.existsById(id)) {
            throw new RuntimeException("Packing checklist item not found with id: " + id);
        }
        packingChecklistItemRepository.deleteById(id);
    }
}
