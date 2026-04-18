package com.nathaniel.travel_guide_app.dto.admin_dto.request;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BudgetGuideRequest {
    private Long countryId;
    private BigDecimal budgetDaily;
    private BigDecimal midRangeDaily;
    private BigDecimal luxuryDaily;
    private BigDecimal averageHotelCost;
    private BigDecimal averageMealCost;
    private BigDecimal averageTransportCost;
    private String currency;
}