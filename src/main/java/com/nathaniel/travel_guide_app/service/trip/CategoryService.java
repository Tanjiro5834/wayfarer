package com.nathaniel.travel_guide_app.service.trip;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import com.nathaniel.travel_guide_app.dto.request.trip.CategoryRequest;
import com.nathaniel.travel_guide_app.dto.response.trip.CategoryResponse;
import com.nathaniel.travel_guide_app.entity.Category;
import com.nathaniel.travel_guide_app.mapper.CategoryMapper;
import com.nathaniel.travel_guide_app.repository.Trip.CategoryRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public List<CategoryResponse> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        List<CategoryResponse> categoryList = new ArrayList<>();

        for(Category category : categories){
            categoryList.add(categoryMapper.toResponse(category));
        }

        return categoryList;
    }

    public Category getById(Long id) {
        return categoryRepository.findById(id).orElse(null);
    }

    public Category getByName(String name) {
        return categoryRepository.findByNameIgnoreCase(name).orElse(null);
    }

    @Transactional
    public CategoryResponse create(CategoryRequest categoryRequest) {
        if(categoryRepository.findByNameIgnoreCase(categoryRequest.getName()).isPresent()){
            throw new RuntimeException("Category with name " + categoryRequest.getName() + " already exists");
        }
        
        Category category = new Category();
        category.setName(categoryRequest.getName());
        category.setDescription(categoryRequest.getDescription());

        Category saved = categoryRepository.save(category);
        return categoryMapper.toResponse(saved);
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest categoryRequest) {
        Category existing = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found with ID: " + id));

        existing.setName(categoryRequest.getName());
        existing.setDescription(categoryRequest.getDescription());

        Category saved = categoryRepository.save(existing);
        return categoryMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Category existing = categoryRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Category not found with ID: " + id));

        categoryRepository.delete(existing);
    }
}