package com.nathaniel.travel_guide_app.service.trip;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import com.nathaniel.travel_guide_app.dto.request.trip.TripDayRequest;
import com.nathaniel.travel_guide_app.dto.response.trip.TripDayResponse;
import com.nathaniel.travel_guide_app.entity.Trip;
import com.nathaniel.travel_guide_app.entity.TripActivity;
import com.nathaniel.travel_guide_app.entity.TripDay;
import com.nathaniel.travel_guide_app.mapper.TripDayMapper;
import com.nathaniel.travel_guide_app.repository.Trip.TripDayRepository;
import com.nathaniel.travel_guide_app.repository.Trip.TripRepository;
import jakarta.transaction.TransactionScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TripDayService {
    private final TripDayRepository tripDayRepository;
    private final TripRepository tripRepository;
    private final TripDayMapper tripDayMapper;

    public List<TripDay> getByTrip(Long tripId) {
        return tripDayRepository.findByTripIdOrderByDayNumberAsc(tripId);
    }

    public TripDay getById(Long id) {
        return tripDayRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Trip day not found with id: " + id));
    }

    @Transactional
    public TripDayResponse createTripDay(TripDayRequest tripDayRequest) {
        Trip trip = tripRepository.findById(tripDayRequest.getTripId())
            .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripDayRequest.getTripId()));
        
        List<TripDay> tripDays = tripDayRepository.findByTripIdOrderByDayNumberAsc(trip.getId());
        List<TripActivity> existingActivities = new ArrayList<>();

        for(TripDay day : tripDays){
            for(TripActivity activity : day.getActivities()){
                existingActivities.add(activity);
            }
        }

        TripDay tripDay = new TripDay();

        tripDay.setTrip(trip);
        tripDay.setDayNumber(tripDayRequest.getDayNumber());
        tripDay.setDate(tripDayRequest.getDate());
        tripDay.setNotes(tripDayRequest.getNotes());
        tripDay.setActivities(existingActivities);

        TripDay saved = tripDayRepository.save(tripDay);

        return tripDayMapper.toResponse(saved);
    }

    @Transactional
    public TripDayResponse updateTripDay(Long id, TripDayRequest tripDayRequest) {
        TripDay existing = tripDayRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Trip day not found with id: " + id));

        Trip trip = tripRepository.findById(tripDayRequest.getTripId())
            .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripDayRequest.getTripId()));

        tripDayMapper.updateEntity(existing, tripDayRequest, trip);
        TripDay updated = tripDayRepository.save(existing);
        return tripDayMapper.toResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        TripDay existing = tripDayRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Trip day not found with id: " + id));
        tripDayRepository.delete(existing);
    }
}