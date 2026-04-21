package com.nathaniel.travel_guide_app.service.trip;

import java.util.List;
import org.springframework.stereotype.Service;
import com.nathaniel.travel_guide_app.dto.request.trip.TripRequest;
import com.nathaniel.travel_guide_app.dto.response.trip.TripResponse;
import com.nathaniel.travel_guide_app.entity.Destination;
import com.nathaniel.travel_guide_app.entity.Trip;
import com.nathaniel.travel_guide_app.enums.TripStatus;
import com.nathaniel.travel_guide_app.mapper.TripMapper;
import com.nathaniel.travel_guide_app.repository.Trip.DestinationRepository;
import com.nathaniel.travel_guide_app.repository.Trip.TripRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TripService {
    private final TripRepository tripRepository;
    private final DestinationRepository destinationRepository;
    private final TripMapper tripMapper;

    public List<Trip> getByUser(Long userId) {
        return tripRepository.findByUserId(userId);
    }

    public List<Trip> getByUserAndStatus(Long userId, TripStatus status) {
        return tripRepository.findByUserIdAndStatus(userId, status);
    }

    public Trip getById(Long id) {
        return tripRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Trip not found with id: " + id));
    }

    @Transactional
    public TripResponse createTrip(TripRequest tripRequest) {
        Destination destination = destinationRepository.findById(tripRequest.getDestinationId())
            .orElseThrow(() -> new RuntimeException("Destination not found with id: " + tripRequest.getDestinationId()));

        Trip trip = tripMapper.toEntity(tripRequest, destination);
        Trip saved = tripRepository.save(trip);
        return tripMapper.toResponse(saved);
    }

    @Transactional
    public TripResponse updateTrip(Long id, TripRequest tripRequest) {
        Trip trip = tripRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Trip not found with id: " + id));

        Destination destination = destinationRepository.findById(tripRequest.getDestinationId())
                .orElseThrow(() -> new RuntimeException("Destination not found with id: " + tripRequest.getDestinationId()));

        tripMapper.updateEntity(trip, tripRequest, destination);
        Trip saved = tripRepository.save(trip);
        return tripMapper.toResponse(saved);
    }

    @Transactional
    public void deleteTrip(Long id) {
        Trip trip = tripRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Trip not found with id: " + id));
        tripRepository.delete(trip);
    }

    @Transactional
    public TripResponse updateStatus(Long id, TripStatus status) {
        Trip trip = tripRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Trip not found with id: " + id));
        trip.setStatus(status);

        Trip saved = tripRepository.save(trip);
        return tripMapper.toResponse(saved);
    }
}