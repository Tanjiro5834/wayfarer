package com.nathaniel.travel_guide_app.repository.Trip;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.nathaniel.travel_guide_app.entity.TripDay;

public interface TripDayRepository extends JpaRepository<TripDay, Long> {
    List<TripDay> findByTripIdOrderByDayNumberAsc(Long tripId);
}