package com.nathaniel.travel_guide_app.service.trip;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.nathaniel.travel_guide_app.dto.request.trip.TripRequest;
import com.nathaniel.travel_guide_app.dto.response.trip.TripDayResponse;
import com.nathaniel.travel_guide_app.dto.response.trip.TripResponse;
import com.nathaniel.travel_guide_app.entity.Country;
import com.nathaniel.travel_guide_app.entity.Place;
import com.nathaniel.travel_guide_app.entity.Trip;
import com.nathaniel.travel_guide_app.entity.TripActivity;
import com.nathaniel.travel_guide_app.entity.TripDay;
import com.nathaniel.travel_guide_app.enums.TravelStyle;
import com.nathaniel.travel_guide_app.enums.TripStatus;
import com.nathaniel.travel_guide_app.mapper.TripDayMapper;
import com.nathaniel.travel_guide_app.mapper.TripMapper;
import com.nathaniel.travel_guide_app.repository.CountryRepository;
import com.nathaniel.travel_guide_app.repository.Trip.PlaceRepository;
import com.nathaniel.travel_guide_app.repository.Trip.TripActivityRepository;
import com.nathaniel.travel_guide_app.repository.Trip.TripDayRepository;
import com.nathaniel.travel_guide_app.repository.Trip.TripRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final TripActivityRepository tripActivityRepository;
    private final TripDayRepository tripDayRepository;
    private final PlaceRepository placeRepository;
    private final CountryRepository countryRepository;
    private final TripMapper tripMapper;
    private final TripDayMapper tripDayMapper;

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
        Country country = countryRepository.findById(tripRequest.getCountryId())
            .orElseThrow(() -> new RuntimeException(
                "Country not found with id: " + tripRequest.getCountryId()
            ));

        Trip trip = tripMapper.toEntity(tripRequest, country);
        Trip saved = tripRepository.save(trip);

        return tripMapper.toResponse(saved);
    }

    @Transactional
    public TripResponse generateTrip(TripRequest tripRequest) {
        if (tripRequest.getNumberOfDays() == null || tripRequest.getNumberOfDays() <= 0) {
            throw new RuntimeException("Number of days must be greater than 0");
        }

        Long countryId = tripRequest.getCountryId();

        Country country = countryRepository.findById(countryId)
            .orElseThrow(() -> new RuntimeException("Country not found with id: " + countryId));

        if (tripRequest.getStartDate() == null) {
            tripRequest.setStartDate(LocalDate.now());
        }

        tripRequest.setEndDate(
            tripRequest.getStartDate().plusDays(tripRequest.getNumberOfDays() - 1)
        );

        if (tripRequest.getTitle() == null || tripRequest.getTitle().isBlank()) {
            tripRequest.setTitle(country.getName() + " " + tripRequest.getNumberOfDays() + "-Day Trip");
        }

        if (tripRequest.getUserId() == null) {
            tripRequest.setUserId(1L); // temporary until auth is ready
        }

        Trip trip = tripMapper.toEntity(tripRequest, country);
        trip.setStatus(TripStatus.DRAFT);

        Trip saved = tripRepository.save(trip);

        generateTripDays(saved);

        return tripMapper.toResponse(saved);
    }

    @Transactional
    public TripResponse updateTrip(Long id, TripRequest tripRequest) {
        Trip trip = tripRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Trip not found with id: " + id));

        Long countryId = tripRequest.getCountryId() != null ? tripRequest.getCountryId() : trip.getCountry().getId();

        Country country = countryRepository.findById(countryId)
            .orElseThrow(() -> new RuntimeException("Country not found with id: " + countryId));

        tripMapper.updateEntity(trip, tripRequest, country);

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

    private void generateTripDays(Trip trip) {
        for (int i = 0; i < trip.getNumberOfDays(); i++) {
            TripDay day = new TripDay();

            day.setTrip(trip);
            day.setDayNumber(i + 1);
            day.setDate(trip.getStartDate().plusDays(i));

            TripDay savedDay = tripDayRepository.save(day);

            generateActivities(savedDay, trip);
        }
    }

    private void generateActivities(TripDay day, Trip trip) {
        List<Place> places = placeRepository.findByCountryId(trip.getCountry().getId());
        String[][] slots = pickSlots(trip.getTravelStyle());

        for (int i = 0; i < slots.length && i < places.size(); i++) {
            String[] time = slots[i];

            TripActivity activity = new TripActivity();
            activity.setTripDay(day);
            activity.setPlace(places.get(i));
            activity.setStartTime(LocalTime.parse(time[0]));
            activity.setEndTime(LocalTime.parse(time[1]));
            activity.setSortOrder(i + 1);
            activity.setNotes("Visit " + places.get(i).getName());

            tripActivityRepository.save(activity);
        }
    }

    public TripResponse getResponseById(Long id) {
        Trip trip = tripRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Trip not found with id: " + id));

        return tripMapper.toResponse(trip);
    }

    public List<TripDayResponse> getResponsesByTripId(Long tripId) {
        return tripDayRepository.findByTripIdOrderByDayNumberAsc(tripId)
            .stream()
            .map(tripDayMapper::toResponse)
            .toList();
    }

    private String[][] pickSlots(TravelStyle travelStyle) {
        if (travelStyle == null) {
            travelStyle = TravelStyle.SOLO;
        }

        return switch (travelStyle) {
            case BACKPACKING -> new String[][] {
                {"07:00", "09:00"},
                {"09:30", "11:30"},
                {"13:00", "15:00"},
                {"15:30", "18:00"}
            };
            case BUSINESS -> new String[][] {
                {"08:00", "10:00"},
                {"12:00", "13:00"},
                {"18:00", "20:00"}
            };
            case COUPLE -> new String[][] {
                {"09:00", "11:00"},
                {"13:00", "15:00"},
                {"17:00", "19:00"}
            };
            case FAMILY -> new String[][] {
                {"09:00", "11:00"},
                {"13:00", "15:00"},
                {"16:00", "18:00"}
            };
            case FRIENDS -> new String[][] {
                {"10:00", "12:00"},
                {"13:30", "15:30"},
                {"17:00", "19:00"}
            };
            case SOLO -> new String[][] {
                {"08:00", "10:00"},
                {"10:30", "12:00"},
                {"13:30", "15:00"},
                {"15:30", "17:00"}
            };
        };
    }
}