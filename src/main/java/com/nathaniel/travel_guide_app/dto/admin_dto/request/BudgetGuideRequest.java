package com.nathaniel.travel_guide_app.dto.admin_dto.request;

import java.math.BigDecimal;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BudgetGuideRequest {
    private Long countryId;

    //legacy
    private BigDecimal budgetDaily;
    private BigDecimal midRangeDaily;
    private BigDecimal luxuryDaily;
    private BigDecimal averageHotelCost;
    private BigDecimal averageMealCost;
    private BigDecimal averageTransportCost;
    
    
    private String currency;

    //additions
    private String savingTips;
    private List<BudgetTierRequest> tiers;
}