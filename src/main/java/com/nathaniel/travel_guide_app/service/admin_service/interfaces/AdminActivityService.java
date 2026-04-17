package com.nathaniel.travel_guide_app.service.admin_service.interfaces;
import java.util.List;
import com.nathaniel.travel_guide_app.dto.admin_dto.response.AdminActivityResponse;

public interface AdminActivityService {
    List<AdminActivityResponse> getRecentActivity();
}