# GEA Sales Calculation Engine API

A FastAPI-based backend service for calculating Total Cost of Ownership (TCO) for GEA industrial machines. This API provides endpoints for managing projects, filtering relevant machines, and performing TCO calculations.

## Table of Contents

- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Examples](#examples)
- [Error Handling](#error-handling)

## Getting Started

### Prerequisites

- Python 3.11+
- FastAPI
- See `requirements.txt` for complete dependencies

### Running the Server

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The API will be available at:
- **Development**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs` (Swagger UI)
- **Alternative Docs**: `http://localhost:8000/redoc` (ReDoc)

## API Endpoints

### Health Check

#### `GET /health`
Check if the service is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "GEA Sales Calculation Engine"
}
```

#### `GET /`
Get basic API information.

**Response:**
```json
{
  "message": "GEA Sales Calculation Engine API",
  "version": "1.0.0",
  "status": "running",
  "docs": "/docs"
}
```

### Project Management

#### `GET /api/calculation/projects`
Retrieve all projects.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "projects": [
    {
      "project_name": "Dairy Processing Plant A",
      "company_name": "MilkCorp Industries",
      "telefon_nummer": "+49 123 456 7890",
      "email": "contact@milcorp.com",
      "contact_person": "Hans Mueller",
      "application": "Dairy",
      "sub_application": "Milk Separation",
      "solids_percentage": 12.5,
      "customer_throughput_per_day": 5000.0,
      "workdays_per_week": 5,
      "protection_class": "IP65",
      "motor_efficiency": "≥ IE3",
      "length_mm": 2500.0,
      "width_mm": 1800.0,
      "height_mm": 2200.0,
      "weight_kg": 4500.0
    }
  ]
}
```

#### `GET /api/calculation/projects/{project_name}`
Retrieve a specific project by name.

**Parameters:**
- `project_name` (path): Name of the project to retrieve

**Response:**
```json
{
  "success": true,
  "project": {
    "project_name": "Dairy Processing Plant A",
    "company_name": "MilkCorp Industries",
    // ... other project fields
  },
  "message": "Project 'Dairy Processing Plant A' retrieved successfully"
}
```

**Error Response (404):**
```json
{
  "detail": "Project 'NonExistentProject' not found"
}
```

#### `POST /api/calculation/projects`
Create a new project or update an existing one.

**Request Body:**
```json
{
  "project_name": "New Processing Plant",
  "company_name": "Example Corp",
  "telefon_nummer": "+49 123 456 7890",
  "email": "contact@example.com",
  "contact_person": "John Doe",
  "application": "Dairy",
  "sub_application": "Milk Separation",
  "solids_percentage": 15.0,
  "customer_throughput_per_day": 6000.0,
  "workdays_per_week": 5,
  "protection_class": "IP65",
  "motor_efficiency": "≥ IE3",
  "length_mm": 3000.0,
  "width_mm": 2000.0,
  "height_mm": 2500.0,
  "weight_kg": 5000.0
}
```

**Response:**
```json
{
  "success": true,
  "project": {
    "project_name": "New Processing Plant",
    // ... all project fields
  },
  "message": "Project 'New Processing Plant' created successfully"
}
```

### TCO Calculations

#### `POST /api/calculation/projects/{project_name}/tco`
Calculate TCO for all relevant machines for a specific project.

**Parameters:**
- `project_name` (path): Name of the project

**Request Body:**
```json
{
  "years": 5,
  "electricity_eur_per_kwh": 0.25,
  "water_eur_per_l": 0.002,
  "commissioning_pct": 0.10,
  "extra_maint_pct": 0.00,
  "label": "Custom Calculation",
  "operation_hours_per_year": 8000,
  "throughput_per_day": 5000,
  "workdays_per_week": 5,
  "operation_hours_per_day": 12
}
```

**TCO Calculation Parameters:**
- `years` (int, default: 5): Number of years for calculation
- `electricity_eur_per_kwh` (float, default: 0.25): Electricity cost per kWh
- `water_eur_per_l` (float, default: 0.002): Water cost per liter
- `commissioning_pct` (float, default: 0.10): Commissioning percentage of list price
- `extra_maint_pct` (float, default: 0.00): Extra maintenance percentage
- `label` (string, optional): Custom label for the calculation
- `operation_hours_per_year` (float, optional): Hours of operation per year
- `throughput_per_day` (float, optional): Daily throughput in capacity units
- `workdays_per_week` (int, default: 5): Number of workdays per week (1-7)
- `operation_hours_per_day` (float, optional): Available operation hours per day

**Note:** You must provide either `operation_hours_per_year` OR `throughput_per_day` for the calculation.

**Response:**
```json
{
  "success": true,
  "project": {
    "project_name": "Dairy Processing Plant A",
    // ... project details
  },
  "relevant_machines": [
    {
      "application": "Dairy",
      "sub_application": "Milk Separation",
      "feed_solids_min_vol_perc": 10.0,
      "feed_solids_max_vol_perc": 20.0,
      "capacity_min_inp": 1000.0,
      "capacity_max_inp": 8000.0,
      "drive_type": "Direct Drive",
      "level": "Standard",
      "langtyp": "GEA",
      "dmr": 550.0,
      "list_price": 125000.0,
      "motor_power_kw": 45.0,
      "protection_class": "IP65",
      "motor_efficiency": "≥ IE3",
      "op_water_supply_bar": 3.0,
      "op_water_l_s": 2.5,
      "op_water_l_it_eject": 15.0,
      "length_mm": 2500.0,
      "width_mm": 1800.0,
      "height_mm": 2200.0,
      "total_weight_kg": 4500.0,
      "bowl_weight_kg": 1200.0,
      "motor_weight_kg": 300.0,
      "bowl_volume_lit": 150.0,
      "ejection_system": "Pneumatic",
      "power_consumption_total_kw": 45.0
    }
  ],
  "tco_results": [
    {
      "label": "Dairy – Milk Separation – DMR 550 mm",
      "monthly_cum_total": [
        137500.0,
        141250.0,
        145000.0,
        // ... monthly cumulative totals for 60 months
      ],
      "ca": 125000.0,
      "cc": 12500.0,
      "co": 45000.0,
      "cm": 30000.0
    }
  ],
  "message": "TCO calculated for 1 relevant machines"
}
```

## Data Models

### ProjectRequest
```json
{
  "project_name": "string",
  "company_name": "string",
  "telefon_nummer": "string",
  "email": "string",
  "contact_person": "string",
  "application": "string",
  "sub_application": "string",
  "solids_percentage": "number",
  "customer_throughput_per_day": "number",
  "workdays_per_week": "integer",
  "protection_class": "string",
  "motor_efficiency": "string (optional)",
  "length_mm": "number",
  "width_mm": "number",
  "height_mm": "number",
  "weight_kg": "number"
}
```

### TCOCalculationRequest
```json
{
  "years": "integer (default: 5)",
  "electricity_eur_per_kwh": "number (default: 0.25)",
  "water_eur_per_l": "number (default: 0.002)",
  "commissioning_pct": "number (default: 0.10)",
  "extra_maint_pct": "number (default: 0.00)",
  "label": "string (optional)",
  "operation_hours_per_year": "number (optional)",
  "throughput_per_day": "number (optional)",
  "workdays_per_week": "integer (default: 5)",
  "operation_hours_per_day": "number (optional)"
}
```

### TCO Result
```json
{
  "label": "string",
  "monthly_cum_total": ["number array"],
  "ca": "number (acquisition cost)",
  "cc": "number (commissioning cost)",
  "co": "number (operating cost)",
  "cm": "number (maintenance cost)"
}
```

## Examples

### Example 1: Create a Project and Calculate TCO

```bash
# 1. Create a new project
curl -X POST "http://localhost:8000/api/calculation/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Brewery Centrifuge",
    "company_name": "Bavarian Brewery",
    "telefon_nummer": "+49 987 654 3210",
    "email": "engineering@bavarianbrewery.de",
    "contact_person": "Maria Schmidt",
    "application": "Brewery",
    "sub_application": "Wort Clarification",
    "solids_percentage": 8.2,
    "customer_throughput_per_day": 8000.0,
    "workdays_per_week": 6,
    "protection_class": "IP54",
    "motor_efficiency": "≥ IE4",
    "length_mm": 3200.0,
    "width_mm": 2000.0,
    "height_mm": 2800.0,
    "weight_kg": 6200.0
  }'

# 2. Calculate TCO for the project
curl -X POST "http://localhost:8000/api/calculation/projects/Brewery Centrifuge/tco" \
  -H "Content-Type: application/json" \
  -d '{
    "years": 5,
    "electricity_eur_per_kwh": 0.30,
    "water_eur_per_l": 0.003,
    "operation_hours_per_year": 8000
  }'
```

### Example 2: Get All Projects

```bash
curl -X GET "http://localhost:8000/api/calculation/projects"
```

### Example 3: Calculate TCO Using Throughput

```bash
curl -X POST "http://localhost:8000/api/calculation/projects/Dairy Processing Plant A/tco" \
  -H "Content-Type: application/json" \
  -d '{
    "years": 7,
    "electricity_eur_per_kwh": 0.22,
    "water_eur_per_l": 0.0015,
    "throughput_per_day": 5000,
    "workdays_per_week": 5,
    "operation_hours_per_day": 16
  }'
```

## Error Handling

The API uses standard HTTP status codes and returns error details in JSON format:

### Common Error Responses

**400 Bad Request:**
```json
{
  "detail": "Must provide either operation_hours_per_year, throughput_per_day, or operation_hours_per_day"
}
```

**404 Not Found:**
```json
{
  "detail": "Project 'NonExistentProject' not found"
}
```

**422 Unprocessable Entity:**
```json
{
  "detail": [
    {
      "loc": ["body", "project_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Error calculating project TCO: Invalid capacity_max_inp: 0.0. Cannot calculate operation hours from throughput."
}
```

## Machine Filtering Logic

The API automatically filters machines based on project requirements:

1. **Application Match**: Machine application must match project application (case-insensitive)
2. **Sub-Application Match**: Machine sub-application must match project sub-application
3. **Solids Percentage**: Project solids percentage must be within machine's range
4. **Throughput Capacity**: Machine must be able to handle project throughput requirements
5. **Protection Class**: Machine protection class must meet or exceed project requirements
6. **Motor Efficiency**: Machine motor efficiency must meet or exceed project requirements

## TCO Calculation Details

The TCO calculation includes:

- **Acquisition Cost (Ca)**: Machine list price
- **Commissioning Cost (Cc)**: Percentage of list price (default 10%)
- **Operating Cost (Co)**: Monthly energy and water costs
- **Maintenance Cost (Cm)**: Service costs based on DMR and drive type
  - Service intervals: Every 8000 hours OR 24 months (whichever comes first)
  - Service costs: €10,000 (< 400mm DMR), €15,000 (400-700mm), €20,000 (> 700mm)
  - Flat-belt drives: Additional €2,000 per service

## Demo Data

The API comes pre-loaded with demo projects:
- **Dairy Processing Plant A** (MilkCorp Industries)
- **Brewery Centrifuge System** (Bavarian Brewery Co.)
- **Pharmaceutical Separation Unit** (MedPharm Solutions)

These can be used for testing and demonstration purposes.
