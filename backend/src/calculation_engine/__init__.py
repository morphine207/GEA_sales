"""
GEA Sales TCO Calculation Engine

This package provides tools for calculating Total Cost of Ownership (TCO) 
for GEA machines based on various operational parameters.

Main components:
- MachineData: Represents a single machine with all its specifications
- TCO: Represents the calculated total cost of ownership
- Engine: Entry point with CSV loading and calculation functions
"""

from .machine_data import MachineData
from .tco import TCO
from .engine import (
    load_machines_from_csv,
    calculate_tco_for_machine,
    compare_machines,
    save_machines_to_json
)

__version__ = "1.0.0"
__all__ = [
    "MachineData",
    "TCO", 
    "load_machines_from_csv",
    "calculate_tco_for_machine",
    "compare_machines",
    "save_machines_to_json"
]
