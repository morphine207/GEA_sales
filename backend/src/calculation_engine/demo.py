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
    """Create demo projects that match machines in the CSV so filtering returns results."""

    # Matches Wine machines (e.g., GFA 40-87-600 / GFA 40-12-596)
    demo_project_1 = Project(
        project_name="Wine Project Demo",
        company_name="Acme Wine Corp",
        telefon_nummer="+49 123 456 789",
        email="sales@acmewine.com",
        contact_person="John Smith",
        application="Wine",
        sub_application="Clarific. of Sparkling Wine",
        solids_percentage=0.4,  # within 0.3–0.5
        customer_throughput_per_day=5000.0,  # within 5,000–9,000
        workdays_per_week=5,
        protection_class="IP55",
        motor_efficiency="≥ IE3",
        length_mm=2500.0,
        width_mm=1800.0,
        height_mm=2200.0,
        weight_kg=850.0,
    )

    # Matches Beer machines (e.g., GFA 200-98-270 / GFA 200-18-944)
    demo_project_2 = Project(
        project_name="Beer Project Demo",
        company_name="Bavarian Brewery",
        telefon_nummer="+49 987 654 321",
        email="engineering@bavarianbrew.de",
        contact_person="Maria Mueller",
        application="Beer",
        sub_application="Clarification of Kwass",
        solids_percentage=0.3,  # within 0.2–0.5
        customer_throughput_per_day=20000.0,  # within 16,000–26,000
        workdays_per_week=5,
        protection_class="IP00",  # match machine requirement
        motor_efficiency=None,  # machines have '-' → treat as no requirement
        length_mm=3000.0,
        width_mm=2000.0,
        height_mm=2400.0,
        weight_kg=1200.0,
    )

    # Matches Tea machines (e.g., GFA 10-50-645)
    demo_project_3 = Project(
        project_name="Tea Processing Line",
        company_name="Alpine Tea Co",
        telefon_nummer="+41 555 123 456",
        email="contact@alpinetee.ch",
        contact_person="Hans Weber",
        application="Tea",
        sub_application="Clarification of RTD Tea",
        solids_percentage=0.3,  # within 0.2–0.5
        customer_throughput_per_day=1500.0,  # within 1,000–1,800
        workdays_per_week=5,
        protection_class="IP55",
        motor_efficiency="≥ IE3",
        length_mm=2000.0,
        width_mm=1200.0,
        height_mm=2000.0,
        weight_kg=650.0,
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
