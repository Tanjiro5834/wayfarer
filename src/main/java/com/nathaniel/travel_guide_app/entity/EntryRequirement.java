package com.nathaniel.travel_guide_app.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "entry_requirements")
@Getter
@Setter
public class EntryRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "country_id", nullable = false, unique = true)
    private Country country;

    private String visaType;
    private Integer maxStayDays;
    private String passportValidityRequired;
    private String travelInsurance;

    @Column(length = 2000)
    private String vaccinationRequirements;

    @Column(length = 2000)
    private String customsNotes;

    @Column(length = 2000)
    private String additionalNotes;
}