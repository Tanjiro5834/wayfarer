package com.nathaniel.travel_guide_app.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.nathaniel.travel_guide_app.entity.EntryRequirement;

public interface EntryRequirementRepository extends JpaRepository<EntryRequirement, Long> {
    Optional<EntryRequirement> findByCountryId(Long countryId);
    boolean existsByCountryId(Long countryId);
}
