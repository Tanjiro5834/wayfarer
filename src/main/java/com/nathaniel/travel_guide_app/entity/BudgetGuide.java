package com.nathaniel.travel_guide_app.entity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonManagedReference;
@Entity
@Table(name = "budget_guides")
@Getter
@Setter
public class BudgetGuide {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "country_id", nullable = false, unique = true)
    private Country country;

    private BigDecimal budgetDaily;
    private BigDecimal midRangeDaily;
    private BigDecimal luxuryDaily;

    private BigDecimal averageHotelCost;
    private BigDecimal averageMealCost;
    private BigDecimal averageTransportCost;

    private String currency;
    private String savingTips;

    @OneToMany(mappedBy = "budgetGuide", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<BudgetTier> tiers = new ArrayList<>();
}