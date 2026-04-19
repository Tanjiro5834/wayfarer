# Travi

Travi is a travel guide web application that helps users explore destination countries with practical, organized, and easy-to-access travel information.

It provides country overviews, entry requirements, budget guides, packing checklists, local travel tips, and culture guides through a clean interface backed by a structured Spring Boot REST API.

---

## Features

- Country directory with detailed destination information
- Entry requirements management
- Budget guides with tier-based travel costs
- Packing checklist recommendations
- Local travel tips
- Culture guides
- Admin dashboard for content management
- RESTful API design
- Structured backend using layered architecture
- PostgreSQL database integration
- Flyway database migrations

---

## Tech Stack

### Backend
- Java
- Spring Boot
- Spring Web
- Spring Data JPA
- PostgreSQL
- Flyway
- Maven

### Frontend
- HTML
- CSS
- JavaScript

---

## Project Structure

```text
src/
├── main/
│   ├── java/com/nathaniel/travel_guide_app/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   ├── mapper/
│   │   └── exception/
│   └── resources/
│       ├── static/
│       ├── templates/
│       ├── db/migration/
│       └── application.properties
