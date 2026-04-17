package com.nathaniel.travel_guide_app.controller.admin;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.nathaniel.travel_guide_app.dto.admin_dto.response.AdminActivityResponse;
import com.nathaniel.travel_guide_app.service.admin_service.AdminActivityServiceImpl;
import java.util.List;

@RestController
@RequestMapping("/api/admin/activity")
public class AdminActivityController {

    private final AdminActivityServiceImpl adminActivityService;

    public AdminActivityController(AdminActivityServiceImpl adminActivityService) {
        this.adminActivityService = adminActivityService;
    }

    @GetMapping
    public List<AdminActivityResponse> getRecentActivity() {
        return adminActivityService.getRecentActivity();
    }
}