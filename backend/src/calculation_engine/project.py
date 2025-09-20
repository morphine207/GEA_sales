from dataclasses import dataclass, asdict
from typing import Optional


@dataclass
class Project:
    """
    Represents a project with customer and application details for TCO calculations.
    
    This class contains all the necessary information about a project including
    customer contact details, application specifications, and operational parameters
    that are used in TCO calculations.
    """
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
    motor_efficiency: Optional[str]
    length_mm: float
    width_mm: float
    height_mm: float
    weight_kg: float

    def to_dict(self) -> dict:
        """Convert the Project instance to a dictionary."""
        return asdict(self)

    def __str__(self) -> str:
        """String representation of the Project."""
        return f"Project: {self.project_name} ({self.company_name})"

    def __repr__(self) -> str:
        """Detailed string representation of the Project."""
        return (f"Project(project_name='{self.project_name}', "
                f"company_name='{self.company_name}', "
                f"application='{self.application}', "
                f"sub_application='{self.sub_application}')")
