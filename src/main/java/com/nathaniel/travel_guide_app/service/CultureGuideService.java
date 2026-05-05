package com.nathaniel.travel_guide_app.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import com.nathaniel.travel_guide_app.entity.CultureGuideItem;
import com.nathaniel.travel_guide_app.repository.CultureGuideItemRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CultureGuideService {
    private final CultureGuideItemRepository cultureGuideItemRepository;

    public List<CultureGuideItem> getCountryById(Long countryId){
        return cultureGuideItemRepository.findByCountryIdOrderByTypeAscIdAsc(countryId);
    }

    public Map<String, List<CultureGuideItem>> getByCountryIdGroupedByType(Long countryId) {
        return cultureGuideItemRepository.findByCountryIdOrderByTypeAscIdAsc(countryId)
        .stream()
        .collect(Collectors.groupingBy(CultureGuideItem::getType));
    }
}
