from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from src.calculation_engine.engine import (
    load_machines_from_csv,
    calculate_tco_for_machine,
    compare_machines,
    save_machines_to_json,
    filter_machines_for_project
)
from src.calculation_engine.machine_data import MachineData
from src.calculation_engine.project import Project
from src.calculation_engine.tco import TCO
from src.calculation_engine.demo import get_demo_data

router = APIRouter(prefix="/api/calculation", tags=["calculation"])

# In-memory storage for projects (using project_name as primary key)
projects_storage: dict[str, Project] = {}

# Auto-load demo data on startup
def _load_demo_data():
    """Load demo data into projects storage on startup."""
    try:
        demo_data = get_demo_data()
        for project in demo_data["projects"]:
            projects_storage[project.project_name] = project
        print(f"✅ Loaded {len(demo_data['projects'])} demo projects on startup")
    except Exception as e:
        print(f"⚠️ Warning: Could not load demo data on startup: {e}")

# Load demo data when module is imported
_load_demo_data()


class TCOCalculationRequest(BaseModel):
    years: int = 5
    electricity_eur_per_kwh: float = 0.25
    water_eur_per_l: float = 0.002
    commissioning_pct: float = 0.10
    extra_maint_pct: float = 0.00
    label: Optional[str] = None
    # Operation hours approach
    operation_hours_per_year: Optional[float] = None
    # Throughput approach
    throughput_per_day: Optional[float] = None
    workdays_per_week: int = 5
    operation_hours_per_day: Optional[float] = None

class ProjectRequest(BaseModel):
    project_name: str
    company_name: str
    telefon_nummer: str
    email: str
    contact_person: str
    application: str
    sub_application: str
    solids_percentage: float
    customer_throughput_per_day: float
    workdays_per_week: int
    protection_class: str
    motor_efficiency: Optional[str] = None
    length_mm: float
    width_mm: float
    height_mm: float
    weight_kg: float
    # New calculation details persisted with project
    years: Optional[int] = 5
    energy_price_eur_per_kwh: Optional[float] = 0.25
    water_price_eur_per_l: Optional[float] = 0.002

class ProjectResponse(BaseModel):
    success: bool
    project: dict
    message: str

class ProjectsListResponse(BaseModel):
    success: bool
    count: int
    projects: List[dict]

class ProjectTCOResponse(BaseModel):
    success: bool
    project: dict
    relevant_machines: List[dict]
    tco_results: List[dict]
    message: str


class MachinesListResponse(BaseModel):
    success: bool
    count: int
    machines: List[dict]


@router.get("/projects", response_model=ProjectsListResponse)
async def get_projects():
    """Get all projects."""
    try:
        projects_list = [project.to_dict() for project in projects_storage.values()]
        return ProjectsListResponse(
            success=True,
            count=len(projects_list),
            projects=projects_list
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving projects: {str(e)}")

@router.get("/projects/{project_name}", response_model=ProjectResponse)
async def get_project(project_name: str):
    """Get a specific project by name."""
    try:
        if project_name not in projects_storage:
            raise HTTPException(status_code=404, detail=f"Project '{project_name}' not found")
        
        project = projects_storage[project_name]
        return ProjectResponse(
            success=True,
            project=project.to_dict(),
            message=f"Project '{project_name}' retrieved successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving project: {str(e)}")

@router.post("/projects", response_model=ProjectResponse)
async def create_or_update_project(project_data: ProjectRequest):
    """Create a new project or update an existing one."""
    try:
        # Create Project instance from request data
        project = Project(
            project_name=project_data.project_name,
            company_name=project_data.company_name,
            telefon_nummer=project_data.telefon_nummer,
            email=project_data.email,
            contact_person=project_data.contact_person,
            application=project_data.application,
            sub_application=project_data.sub_application,
            solids_percentage=project_data.solids_percentage,
            customer_throughput_per_day=project_data.customer_throughput_per_day,
            workdays_per_week=project_data.workdays_per_week,
            protection_class=project_data.protection_class,
            motor_efficiency=project_data.motor_efficiency,
            length_mm=project_data.length_mm,
            width_mm=project_data.width_mm,
            height_mm=project_data.height_mm,
            weight_kg=project_data.weight_kg,
            years=project_data.years or 5,
            energy_price_eur_per_kwh=project_data.energy_price_eur_per_kwh or 0.25,
            water_price_eur_per_l=project_data.water_price_eur_per_l or 0.002,
        )
        
        # Store/update the project (using project_name as primary key)
        is_update = project_data.project_name in projects_storage
        projects_storage[project_data.project_name] = project
        
        action = "updated" if is_update else "created"
        return ProjectResponse(
            success=True,
            project=project.to_dict(),
            message=f"Project '{project_data.project_name}' {action} successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving project: {str(e)}")

@router.post("/projects/{project_name}/tco", response_model=ProjectTCOResponse)
async def calculate_project_tco(
    project_name: str,
    request: TCOCalculationRequest
):
    """Calculate TCO for all relevant machines for a specific project."""
    try:
        # Check if project exists
        if project_name not in projects_storage:
            raise HTTPException(status_code=404, detail=f"Project '{project_name}' not found")
        
        project = projects_storage[project_name]
        
        # Load all machines from CSV
        csv_path = os.path.join(os.path.dirname(__file__), '..', 'calculation_engine', 'machines.csv')
        all_machines = load_machines_from_csv(csv_path)
        
        # Filter machines based on project requirements
        relevant_machines = filter_machines_for_project(all_machines, project)
        
        if not relevant_machines:
            return ProjectTCOResponse(
                success=True,
                project=project.to_dict(),
                relevant_machines=[],
                tco_results=[],
                message=f"No relevant machines found for project '{project_name}'"
            )
        
        # Calculate TCO for each relevant machine
        tco_results = []
        for machine in relevant_machines:
            # Derive training_cost from commissioning percentage of machine list price
            training_cost = (machine.list_price or 0.0) * float(request.commissioning_pct)

            # Fallback to project defaults if not supplied in request
            calc_years = request.years or project.years
            calc_electricity = request.electricity_eur_per_kwh or project.energy_price_eur_per_kwh
            calc_water = request.water_eur_per_l or project.water_price_eur_per_l

            tco = calculate_tco_for_machine(
                machine,
                years=calc_years,
                electricity_eur_per_kwh=calc_electricity,
                water_eur_per_l=calc_water,
                training_cost=training_cost,
                label=request.label,
                operation_hours_per_year=request.operation_hours_per_year,
                throughput_per_day=project.customer_throughput_per_day,
                workdays_per_week=project.workdays_per_week,
                operation_hours_per_day=request.operation_hours_per_day
            )
            tco_results.append(tco.to_dict())
        
        return ProjectTCOResponse(
            success=True,
            project=project.to_dict(),
            relevant_machines=[machine.to_dict() for machine in relevant_machines],
            tco_results=tco_results,
            message=f"TCO calculated for {len(relevant_machines)} relevant machines"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating project TCO: {str(e)}")


@router.get("/machines", response_model=MachinesListResponse)
async def list_machines():
    """Return all machines loaded from the CSV file."""
    try:
        csv_path = os.path.join(os.path.dirname(__file__), '..', 'calculation_engine', 'machines.csv')
        machines = load_machines_from_csv(csv_path)
        return MachinesListResponse(
            success=True,
            count=len(machines),
            machines=[m.to_dict() for m in machines]
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading machines: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "GEA Sales Calculation Engine"}
