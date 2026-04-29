package com.nathaniel.travel_guide_app.config;

import com.nathaniel.travel_guide_app.entity.Category;
import com.nathaniel.travel_guide_app.repository.Trip.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    private final CategoryRepository categoryRepository;

    @Bean
    public ApplicationRunner seedCategories() {
        return args -> {
            if (categoryRepository.count() == 0) {
                List<Category> categories = List.of(
                    new Category(null, "Temple/Shrine", "Religious and historical sites", null, null),
                    new Category(null, "Nature & Parks", "Gardens, mountains, scenic spots", null, null),
                    new Category(null, "Museum", "Art, history, and cultural museums", null, null),
                    new Category(null, "Shopping District", "Markets, shopping streets, malls", null, null),
                    new Category(null, "Food & Dining", "Famous food streets, markets, restaurants", null, null),
                    new Category(null, "Landmark", "Iconic towers, buildings, viewpoints", null, null),
                    new Category(null, "Entertainment", "Theme parks, arcades, nightlife", null, null),
                    new Category(null, "Beach", "Beaches, islands, coastal attractions", null, null)
                );
                categoryRepository.saveAll(categories);
                System.out.println("✅ Seeded " + categories.size() + " categories into database");
            } else {
                System.out.println("ℹ️ Categories already exist, skipping seed. Count: " + categoryRepository.count());
            }
        };
    }
}
