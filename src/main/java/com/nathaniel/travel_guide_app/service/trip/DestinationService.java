package com.nathaniel.travel_guide_app.service.trip;

import java.util.List;
import org.springframework.stereotype.Service;
import com.nathaniel.travel_guide_app.dto.request.trip.DestinationRequest;
import com.nathaniel.travel_guide_app.dto.response.trip.DestinationResponse;
import com.nathaniel.travel_guide_app.entity.Destination;
import com.nathaniel.travel_guide_app.enums.DestinationType;
import com.nathaniel.travel_guide_app.mapper.DestinationMapper;
import com.nathaniel.travel_guide_app.repository.Trip.DestinationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DestinationService {

    private final DestinationRepository destinationRepository;
    private final DestinationMapper destinationMapper;

    public List<Destination> getAllPublished(){
        return destinationRepository.findByIsPublishedTrue();
    }

    public Destination getById(Long id) {
        return destinationRepository.findById(id).orElse(null);
    }

    public List<Destination> getByType(DestinationType type){
        return destinationRepository.findByType(type);
    }

    @Transactional
    public DestinationResponse create(DestinationRequest destinationRequest){
        if(destinationRepository.findByName(destinationRequest.getName()).isPresent()){
            throw new RuntimeException("Destination with name " + destinationRequest.getName() + " already exists");
        }

        Destination destination = new Destination();

        destination.setName(destinationRequest.getName());
        destination.setDescription(destinationRequest.getDescription());
        destination.setType(destinationRequest.getType());
        destination.setIsPublished(true);
        Destination saved = destinationRepository.save(destination);

        return destinationMapper.toResponse(saved);
    }

    @Transactional
    public Destination update(Long id, Destination destination){
        Destination existing = destinationRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Destination not found with ID: " + id));

        existing.setName(destination.getName());
        existing.setDescription(destination.getDescription());
        existing.setType(destination.getType());
        existing.setIsPublished(destination.getIsPublished());

        return destinationRepository.save(existing);
    }

    @Transactional
    public void delete(Long id){
        Destination existing = destinationRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Destination not found with ID: " + id));

        destinationRepository.delete(existing);
    }

    public Destination publish(Long id){
        Destination destination = getById(id);
        if (destination == null) {
            throw new RuntimeException("Destination not found with ID: " + id);
        }
        destination.setIsPublished(true);
        return destinationRepository.save(destination);
    }

    public Destination unpublish(Long id){
        Destination destination = getById(id);
        if (destination == null) {
            throw new RuntimeException("Destination not found with ID: " + id);
        }
        destination.setIsPublished(false);
        return destinationRepository.save(destination);
    }
}