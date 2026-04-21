package com.nathaniel.travel_guide_app.mapper;

import org.springframework.stereotype.Component;
import com.nathaniel.travel_guide_app.dto.request.trip.CategoryRequest;
import com.nathaniel.travel_guide_app.dto.response.trip.CategoryResponse;
import com.nathaniel.travel_guide_app.entity.Category;

@Component
public class CategoryMapper {

    public Category toEntity(CategoryRequest request) {
        Category category = new Category();
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        return category;
    }

    public CategoryResponse toResponse(Category category) {
        CategoryResponse response = new CategoryResponse();
        response.setId(category.getId());
        response.setName(category.getName());
        response.setDescription(category.getDescription());
        response.setCreatedAt(category.getCreatedAt());
        response.setUpdatedAt(category.getUpdatedAt());
        return response;
    }

    public void updateEntity(Category category, CategoryRequest request) {
        category.setName(request.getName());
        category.setDescription(request.getDescription());
    }
}