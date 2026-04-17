package com.nathaniel.travel_guide_app.controller.admin;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import com.nathaniel.travel_guide_app.dto.admin_dto.request.CreateCountryRequest;
import com.nathaniel.travel_guide_app.dto.admin_dto.request.UpdateCountryRequest;
import com.nathaniel.travel_guide_app.dto.response.CountryResponse;
import com.nathaniel.travel_guide_app.service.CountryService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/countries")
@RequiredArgsConstructor
public class AdminCountryController {
    private final CountryService countryService;

    @GetMapping
    public List<CountryResponse> getAll() {
        return countryService.getAllCountries();
    }

    @PostMapping
    public CountryResponse create(@RequestBody CreateCountryRequest request) {
        return countryService.createCountry(request);
    }

    @PutMapping("/{id}")
    public CountryResponse update(@PathVariable Long id,
                                  @RequestBody UpdateCountryRequest request) {
        return countryService.updateCountry(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        countryService.deleteCountry(id);
    }

    @GetMapping("/test")
    public String test() {
        return "admin country controller reached";
    }
}
