package com.nathaniel.travel_guide_app.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import com.nathaniel.travel_guide_app.dto.response.SavedDestinationResponse;
import com.nathaniel.travel_guide_app.entity.Country;
import com.nathaniel.travel_guide_app.entity.SavedDestination;
import com.nathaniel.travel_guide_app.entity.User;
import com.nathaniel.travel_guide_app.mapper.SavedDestinationMapper;
import com.nathaniel.travel_guide_app.repository.SavedDestinationRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SavedDestinationService {
    private final SavedDestinationRepository savedDestinationRepository;
    private final SavedDestinationMapper savedDestinationMapper;
    private final EntityManager entityManager;

    @Transactional
    public SavedDestinationResponse saveDestination(Long userId, Long countryId){
        boolean exists = savedDestinationRepository.existsByUserIdAndCountryId(userId, countryId);
        if(exists){
            throw new RuntimeException("Destination already saved");
        }

        SavedDestination destination = new SavedDestination();
        destination.setUser(entityManager.getReference(User.class, userId));
        destination.setCountry(entityManager.getReference(Country.class, countryId));
        destination.setSavedAt(LocalDateTime.now());

        SavedDestination saved = savedDestinationRepository.save(destination);
        return savedDestinationMapper.mapToResponse(saved);
    }

    public void removeDestination(Long userId, Long countryId){
        SavedDestination destination = savedDestinationRepository.findByUserIdAndCountryId(userId, countryId)
            .orElseThrow(() -> new EntityNotFoundException("Destination not found"));
        
        savedDestinationRepository.delete(destination);
    }

    public List<SavedDestinationResponse> getSavedDestinations(Long userId){
        List<SavedDestination> savedDestinations = savedDestinationRepository.findByUserId(userId);
        List<SavedDestinationResponse> responses = new ArrayList<>(savedDestinations.size());

        for(SavedDestination sd : savedDestinations){
            responses.add(savedDestinationMapper.mapToResponse(sd));
        }

        return responses;
    }

    public boolean isDestinationSaved(Long userId, Long countryId){
        return savedDestinationRepository.existsByUserIdAndCountryId(userId, countryId);
    }
}
