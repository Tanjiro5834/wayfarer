package com.nathaniel.travel_guide_app.service.trip;

import java.util.List;
import org.springframework.stereotype.Service;
import com.nathaniel.travel_guide_app.dto.request.trip.TripActivityRequest;
import com.nathaniel.travel_guide_app.dto.response.trip.TripActivityResponse;
import com.nathaniel.travel_guide_app.entity.Place;
import com.nathaniel.travel_guide_app.entity.TripActivity;
import com.nathaniel.travel_guide_app.entity.TripDay;
import com.nathaniel.travel_guide_app.mapper.TripActivityMapper;
import com.nathaniel.travel_guide_app.repository.Trip.PlaceRepository;
import com.nathaniel.travel_guide_app.repository.Trip.TripActivityRepository;
import com.nathaniel.travel_guide_app.repository.Trip.TripDayRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripActivityService {
    private final TripActivityRepository tripActivityRepository;
    private final TripDayRepository tripDayRepository;
    private final PlaceRepository placeRepository;
    private final TripActivityMapper tripActivityMapper;

    public List<TripActivity> getByTripDay(Long tripDayId) {
        return tripActivityRepository.findByTripDayIdOrderBySortOrderAsc(tripDayId);
    }

    public TripActivity getById(Long id) {
        return tripActivityRepository.findById(id).orElse(null);
    }

    public TripActivityResponse createTripActivity(TripActivityRequest tripActivityRequest) {
        TripDay tripDay = tripDayRepository.findById(tripActivityRequest.getTripDayId())
            .orElseThrow(() -> new RuntimeException("Trip day not found with ID: " + tripActivityRequest.getTripDayId()));
        
        Place place = placeRepository.findById(tripActivityRequest.getPlaceId())
            .orElseThrow(() -> new RuntimeException("Place not found with ID: " + tripActivityRequest.getPlaceId()));

        TripActivity newActivity = tripActivityMapper.toEntity(tripActivityRequest, tripDay, place);
        TripActivity saved = tripActivityRepository.save(newActivity);
        return tripActivityMapper.toResponse(saved);
    }

    @Transactional
    public TripActivity updateTripActivity(Long id, TripActivity tripActivity) {
        TripActivity existing = tripActivityRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Trip activity not found with ID: " + id));

        existing.setPlace(tripActivity.getPlace());
        existing.setStartTime(tripActivity.getStartTime());
        existing.setEndTime(tripActivity.getEndTime());
        existing.setNotes(tripActivity.getNotes());

        return tripActivityRepository.save(existing);
    }

    @Transactional
    public void deleteTripActivity(Long id) {
        TripActivity tripActivity = tripActivityRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Trip activity not found with ID: " + id));
        tripActivityRepository.delete(tripActivity);
    }

    public List<TripActivity> reorderTripActivities(Long tripDayId, List<Long> orderedIds) {
        List<TripActivity> activities = tripActivityRepository.findByTripDayIdOrderBySortOrderAsc(tripDayId);
        Map<Long, TripActivity> activityMap = activities.stream()
            .collect(Collectors.toMap(TripActivity::getId, a -> a));

        for(int i = 0; i < orderedIds.size(); i++){
            TripActivity activity = activityMap.get(orderedIds.get(i));
            if(activity == null) throw new RuntimeException("Activity not found with id: " + orderedIds.get(i));
            activity.setSortOrder(i + 1);
        }
        return tripActivityRepository.saveAll(activities);
    }
}