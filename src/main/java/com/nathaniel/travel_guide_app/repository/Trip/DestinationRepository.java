package com.nathaniel.travel_guide_app.repository.Trip;

import org.springframework.data.jpa.repository.JpaRepository;
import com.nathaniel.travel_guide_app.entity.Destination;
import com.nathaniel.travel_guide_app.enums.DestinationType;
import java.util.List;
import java.util.Optional;

public interface DestinationRepository extends JpaRepository<Destination, Long> {
    List<Destination> findByIsPublishedTrue();
    List<Destination> findByType(DestinationType type);
    Optional<Destination> findByName(String name);
}