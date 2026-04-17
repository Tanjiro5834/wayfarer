package com.nathaniel.travel_guide_app.dto.admin_dto.response;

public class AdminDashboardResponse {

    private long totalCountries;
    private long publishedGuides;
    private long draftUpdates;
    private long totalSaves;

    public long getTotalCountries() {
        return totalCountries;
    }

    public void setTotalCountries(long totalCountries) {
        this.totalCountries = totalCountries;
    }

    public long getPublishedGuides() {
        return publishedGuides;
    }

    public void setPublishedGuides(long publishedGuides) {
        this.publishedGuides = publishedGuides;
    }

    public long getDraftUpdates() {
        return draftUpdates;
    }

    public void setDraftUpdates(long draftUpdates) {
        this.draftUpdates = draftUpdates;
    }

    public long getTotalSaves() {
        return totalSaves;
    }

    public void setTotalSaves(long totalSaves) {
        this.totalSaves = totalSaves;
    }
}