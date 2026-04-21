package com.nathaniel.travel_guide_app.repository.Trip;


import org.springframework.data.jpa.repository.JpaRepository;
import com.nathaniel.travel_guide_app.entity.Place;
import java.util.List;
import java.util.Optional;

public interface PlaceRepository extends JpaRepository<Place, Long> {
    List<Place> findByDestinationId(Long destinationId);
    List<Place> findByCategoryId(Long categoryId);
    List<Place> findByDestinationIdAndIsPublishedTrue(Long destinationId);
    List<Place> findByIsFeaturedTrue();
    Optional<Place> findByName(String name);
}