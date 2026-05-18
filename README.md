<p align="center">
  <img src="LOGO.png" alt="FluxAxis Logo" width="700" />
</p>

<h1 align="center">ImpactMatch — Volunteer Coordination OS</h1>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Router-v6-CA4245?style=for-the-badge&logo=reactrouter" alt="React Router" />
  <img src="https://img.shields.io/badge/Claude%20AI-Sonnet-CC785C?style=for-the-badge&logo=anthropic" alt="Claude AI" />
  <img src="https://img.shields.io/badge/Design-Custom%20Tokens-14B8A6?style=for-the-badge" alt="Design" />
  <img src="https://img.shields.io/badge/Status-Live-4CAF50?style=for-the-badge" alt="Live" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License" />
</p>

## Overview

A cutting-edge, 12-page React 18 Single Page Application designed for NGO volunteer coordination. Featuring AI-powered match engines, real-time isometric SVG visualization graphics, and a beautifully minimal, flat design system driven purely by robust CSS custom variables.

---

## 🌊 Flowchart

The data pipeline for community surveys reaching a field operative:

```mermaid
flowchart TD
    A([User Submits Survey]) -->|Forms & GPS| B(Survey Intake Processor)
    B --> C{AI Auto-Categorization}
    
    C -->|Critical Crisis| D[Urgency Heatmap & Alerts]
    C -->|General Need| E[Needs Intelligence Dashboard]
    
    V[(Volunteer Registry)] --> F{Match Engine}
    E --> F
    D --> F
    
    F -->|AI Ranking & Filtering| G[Field Operations Kanban]
    G --> H([Impact Analytics])
    
    style A fill:#a855f7,stroke:#333,stroke-width:1px,color:#fff
    style C fill:#3b82f6,stroke:#333,stroke-width:1px,color:#fff
    style D fill:#ff4757,stroke:#333,stroke-width:1px,color:#fff
    style F fill:#14b8a6,stroke:#333,stroke-width:1px,color:#fff
    style H fill:#f59e0b,stroke:#333,stroke-width:1px,color:#fff
```

---

## ⚙️ System Diagram

The overall module relationship mapped visually:

```mermaid
graph LR
    subgraph Frontend [React Single Page Application]
        direction TB
        Context((Global App Context))
        UI[Custom UI Components]
        Pages[[12 Dynamic Pages]]
        SVGs>Isometric SVG Visualizations]
        
        Pages --> UI
        Pages --> SVGs
        Pages --> Context
    end
    
    subgraph Logic [Services & Logic]
        Claude[Claude API Interface]
        Storage[(Local Data Seeding)]
    end
    
    Context <--> Logic
    
    classDef react fill:#eff6ff,stroke:#60a5fa,stroke-width:2px;
    classDef core fill:#f0fdfa,stroke:#2dd4bf,stroke-width:2px;
    
    class Frontend react
    class Logic core
```

---

## 🏛️ Architecture Design

| Component Level | Technology Choice | Responsibility / Description |
| :--- | :--- | :--- |
| **Core Framework** | `React 18` | Declarative View Layer, utilizing functional components and hooks structure. |
| **Build & Bundle** | `Vite` | Extremely fast module replacement (HMR), tree-shaking, and minification. |
| **Application Routing** | `React Router DOM` | Manages nested route layouts and guards across all 12 operational pages. |
| **State Management** | `React Context API` | Provides global access to `volunteers`, `needs`, `zones`, and `settings` globally. |
| **Design / Styling** | `Vanilla CSS 3` | A pure CSS token approach. Avoids tailwind for perfect custom scale increments and `var()` definitions. |
| **Data Enrichment** | `Anthropic API` | Fetches daily briefs, auto-categorizes need forms, and matches volunteers using logic prompts. |
| **Live Graphics** | `Custom SVG DOM` | High-performance interactive visualizations (bar prisms, logic lattices, district grids) rendering natively. |

---

## 📊 Live Sample Data

Snapshot of the mock telemetry populating the initial dashboard grid:

| Zone ID | District Name | Total Needs | Open Needs | Active Volunteers | Area Coverage | Urgency Alert |
| :------- | :------------ | :---------- | :--------- | :---------------- | :------------ | :------------ |
| **z1** | North District | 5 | 3 | 2 | `72%` | <span style="color:#ff4757">**CRITICAL**</span> |
| **z2** | East Commerce | 2 | 1 | 4 | `94%` | <span style="color:#14b8a6">**MODERATE**</span> |
| **z3** | South Valley | 4 | 2 | 1 | `56%` | <span style="color:#fbbf24">**HIGH**</span> |
| **z4** | West Hills | 1 | 0 | 5 | `100%` | <span style="color:#3b82f6">**LOW**</span> |

> _Note: Calculations for coverage are based on volunteer allocation divided by the maximum historical incident baseline._
