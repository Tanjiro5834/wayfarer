package com.nathaniel.travel_guide_app.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import com.nathaniel.travel_guide_app.entity.LocalTip;
import com.nathaniel.travel_guide_app.repository.LocalTipRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LocalTipService {
    private final LocalTipRepository localTipRepository;

    public LocalTip getById(Long id){
        return localTipRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Local tip not found with ID: " + id));
    }   

    public Map<String, List<LocalTip>> getByCountryIdGroupedByCategory(Long countryId){
        return localTipRepository.findByCountryIdOrderByCategoryAsc(countryId)
        .stream()
        .collect(Collectors.groupingBy(LocalTip::getCategory));
    }
}
