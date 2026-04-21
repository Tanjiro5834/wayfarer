package com.nathaniel.travel_guide_app.repository.Trip;


import org.springframework.data.jpa.repository.JpaRepository;
import com.nathaniel.travel_guide_app.entity.Category;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByNameIgnoreCase(String name);
}