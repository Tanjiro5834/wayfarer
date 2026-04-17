package com.nathaniel.travel_guide_app.controller.admin;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.nathaniel.travel_guide_app.dto.admin_dto.response.AdminDashboardResponse;
import com.nathaniel.travel_guide_app.service.admin_service.AdminDashboardServiceImpl;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final AdminDashboardServiceImpl adminDashboardService;

    public AdminDashboardController(AdminDashboardServiceImpl adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping
    public AdminDashboardResponse getDashboard() {
        return adminDashboardService.getDashboardSummary();
    }
}