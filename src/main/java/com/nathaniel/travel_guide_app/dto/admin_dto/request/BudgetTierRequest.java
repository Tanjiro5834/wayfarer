package com.nathaniel.travel_guide_app.dto.admin_dto.request;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BudgetTierRequest {
    private String tierName;

    private BigDecimal accommodationMin;
    private BigDecimal accommodationMax;

    private BigDecimal foodMin;
    private BigDecimal foodMax;

    private BigDecimal transportMin;
    private BigDecimal transportMax;

    private BigDecimal activitiesMin;
    private BigDecimal activitiesMax;

    private BigDecimal dailyTotalMin;
    private BigDecimal dailyTotalMax;
}