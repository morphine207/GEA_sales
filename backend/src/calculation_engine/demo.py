"""
GEA Sales TCO Calculation Engine - Demo Script

This demo script demonstrates the functionality of the calculation engine
by creating example projects, loading machines, and performing TCO calculations.
"""

import os
import sys
from typing import List

# Add the backend directory to the Python path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from .project import Project
from .machine_data import MachineData
from .engine import (
    load_machines_from_csv,
    calculate_tco_for_machine,
    compare_machines,
    filter_machines_for_project
)

def create_demo_projects() -> List[Project]:
    """Create demo projects for testing."""
    
    demo_project_1 = Project(
        project_name="Dairy Processing Plant A",
        company_name="MilkCorp Industries",
        telefon_nummer="+49 123 456 7890",
        email="contact@milcorp.com",
        contact_person="Hans Mueller",
        application="Dairy",
        sub_application="Milk Separation",
        solids_percentage=12.5,
        customer_throughput_per_day=5000.0,
        workdays_per_week=5,
        protection_class="IP65",
        motor_efficiency="≥ IE3",
        length_mm=2500.0,
        width_mm=1800.0,
        height_mm=2200.0,
        weight_kg=4500.0
    )
    
    demo_project_2 = Project(
        project_name="Brewery Centrifuge System",
        company_name="Bavarian Brewery Co.",
        telefon_nummer="+49 987 654 3210",
        email="engineering@bavarianbrewery.de",
        contact_person="Maria Schmidt",
        application="Brewery",
        sub_application="Wort Clarification",
        solids_percentage=8.2,
        customer_throughput_per_day=8000.0,
        workdays_per_week=6,
        protection_class="IP54",
        motor_efficiency="≥ IE4",
        length_mm=3200.0,
        width_mm=2000.0,
        height_mm=2800.0,
        weight_kg=6200.0
    )
    
    demo_project_3 = Project(
        project_name="Pharmaceutical Separation Unit",
        company_name="MedPharm Solutions",
        telefon_nummer="+49 555 123 4567",
        email="projects@medpharm.de",
        contact_person="Dr. Anna Weber",
        application="Pharmaceutical",
        sub_application="API Purification",
        solids_percentage=5.8,
        customer_throughput_per_day=2000.0,
        workdays_per_week=7,
        protection_class="IP67",
        motor_efficiency="≥ IE4",
        length_mm=1800.0,
        width_mm=1200.0,
        height_mm=2000.0,
        weight_kg=3200.0
    )
    
    return [demo_project_1, demo_project_2, demo_project_3]

def get_demo_data():
    """
    Get demo data for the backend API.
    
    Returns:
        dict: Contains projects and machines data for demo purposes
    """
    # Create demo projects
    projects = create_demo_projects()
    
    # Load machines from CSV
    try:
        csv_path = os.path.join(os.path.dirname(__file__), 'machines.csv')
        machines = load_machines_from_csv(csv_path)
    except FileNotFoundError:
        # Return empty machines list if CSV not found
        machines = []
    except Exception:
        # Return empty machines list on any error
        machines = []
    
    return {
        "projects": projects,
        "machines": machines
    }
