package com.nathaniel.travel_guide_app.service.trip;

import java.util.List;
import org.springframework.stereotype.Service;
import com.nathaniel.travel_guide_app.dto.request.trip.PlaceRequest;
import com.nathaniel.travel_guide_app.dto.response.trip.PlaceResponse;
import com.nathaniel.travel_guide_app.entity.Category;
import com.nathaniel.travel_guide_app.entity.Destination;
import com.nathaniel.travel_guide_app.entity.Place;
import com.nathaniel.travel_guide_app.mapper.PlaceMapper;
import com.nathaniel.travel_guide_app.repository.Trip.CategoryRepository;
import com.nathaniel.travel_guide_app.repository.Trip.DestinationRepository;
import com.nathaniel.travel_guide_app.repository.Trip.PlaceRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PlaceService {
    private final PlaceRepository placeRepository;
    private final DestinationRepository destinationRepository;
    private final CategoryRepository categoryRepository;
    private final PlaceMapper placeMapper;

    public Place getById(Long id) {
        return placeRepository.findById(id).orElse(null);
    }

    public List<Place> getByDestination(Long destinationId) {
        return placeRepository.findByDestinationId(destinationId);
    }

    public List<Place> getByCategory(Long categoryId) {
        return placeRepository.findByCategoryId(categoryId);
    }

    public List<Place> getPublishedByDestination(Long destinationId) {
        return placeRepository.findByDestinationIdAndIsPublishedTrue(destinationId);
    }

    public List<Place> getFeatured() {
        return placeRepository.findByIsFeaturedTrue();
    }

    public PlaceResponse create(PlaceRequest placeRequest) {
         Destination destination = destinationRepository.findById(placeRequest.getDestinationId())
            .orElseThrow(() -> new RuntimeException("Destination not found with id: " + placeRequest.getDestinationId()));

        Category category = categoryRepository.findById(placeRequest.getCategoryId())
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + placeRequest.getCategoryId()));

        Place place = placeMapper.toEntity(placeRequest, destination, category);
        Place saved = placeRepository.save(place);
        return placeMapper.toResponse(saved);
    }

    @Transactional
    public PlaceResponse update(Long id, PlaceRequest placeRequest) {
        Place existing = placeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Place not found with ID: " + id));

        existing.setName(placeRequest.getName());
        existing.setDescription(placeRequest.getDescription());

        Place saved = placeRepository.save(existing);
        return placeMapper.toResponse(saved);
    }

    public void delete(Long id) {
        Place existing = placeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Place not found with ID: " + id));
        placeRepository.delete(existing);
    }

    public Place feature(Long id) {
        Place existing = placeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Place not found with ID: " + id));
        existing.setIsFeatured(true);
        return placeRepository.save(existing);
    }

    public Place unfeature(Long id) {
        Place existing = placeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Place not found with ID: " + id));
        existing.setIsFeatured(false);
        return placeRepository.save(existing);
    }

    public Place publish(Long id) {
        Place existing = placeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Place not found with ID: " + id));
        existing.setIsPublished(true);
        return placeRepository.save(existing);
    }

    public Place unpublish(Long id) {
        Place existing = placeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Place not found with ID: " + id));
        existing.setIsPublished(false);
        return placeRepository.save(existing);
    }
}
