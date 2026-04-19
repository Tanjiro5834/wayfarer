package com.nathaniel.travel_guide_app.entity;

import java.math.BigDecimal;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "budget_tiers")
@Getter
@Setter
public class BudgetTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tierName; // BUDGET, MID_RANGE, LUXURY

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

    @ManyToOne
    @JoinColumn(name = "budget_guide_id", nullable = false)
    @JsonBackReference
    private BudgetGuide budgetGuide;
}