package com.nathaniel.travel_guide_app.repository.Trip;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.nathaniel.travel_guide_app.entity.Trip;
import com.nathaniel.travel_guide_app.enums.TripStatus;

public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByUserId(Long userId);
    List<Trip> findByUserIdAndStatus(Long userId, TripStatus status);
}