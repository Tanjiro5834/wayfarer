package com.nathaniel.travel_guide_app.repository.Trip;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.nathaniel.travel_guide_app.entity.TripActivity;

public interface TripActivityRepository extends JpaRepository<TripActivity, Long> {
    List<TripActivity> findByTripDayIdOrderBySortOrderAsc(Long tripDayId);
}