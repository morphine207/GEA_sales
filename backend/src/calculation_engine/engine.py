from typing import List, Dict, Optional
import csv
import json
import math
import pathlib

# Handle imports for both module and direct execution
try:
    from .machine_data import MachineData
    from .tco import TCO
except ImportError:
    from machine_data import MachineData
    from tco import TCO

# Normalize a CSV header to a compact key (lowercase, no spaces/underscores/brackets)
def _norm(s: str) -> str:
    return (
        s.strip()
         .lower()
         .replace(" ", "")
         .replace("\u00a0", "")  # non-breaking space
         .replace("_", "")
         .replace("[", "")
         .replace("]", "")
         .replace("-", "")
    )

# Map normalized CSV headers to MachineData fields
HEADER_MAP: Dict[str, str] = {
    _norm("Application"): "application",
    _norm("Sub Application"): "sub_application",
    _norm("SEP_SQLFeedSolidsMin_VolPerc"): "feed_solids_min_vol_perc",
    _norm("SEP_SQLFeedSolidsMax_VolPerc"): "feed_solids_max_vol_perc",
    _norm("SEP_CapacityMinInp"): "capacity_min_inp",
    _norm("SEP_CapacityMaxInp"): "capacity_max_inp",
    _norm("SEP_DriveType"): "drive_type",
    _norm("SEP_Level"): "level",
    _norm("SEP_SQLLangtyp"): "langtyp",
    _norm("SEP_SQLDMR"): "dmr",
    _norm("Listprice"): "list_price",
    _norm("SEP_SQLMotorPowerKW"): "motor_power_kw",
    _norm("SEP_SQLProtectionClass"): "protection_class",
    _norm("SEP_SQLMotorEfficiency"): "motor_efficiency",
    _norm("SEP_SQLOpWaterSupplyBar"): "op_water_supply_bar",
    _norm("SEP_SQLOpWaterls"): "op_water_l_s",
    _norm("SEP_SQLOpWaterliteject"): "op_water_l_it_eject",
    _norm("SEP_SQLLength"): "length_mm",
    _norm("SEP_SQLWidth"): "width_mm",
    _norm("SEP_SQLHeigth"): "height_mm",   # note: "Heigth" in your sample
    _norm("SEP_SQLTotalWeightKg"): "total_weight_kg",
    _norm("SEP_SQLBowlWeightKg"): "bowl_weight_kg",
    _norm("SEP_SQLMotorWeightKg"): "motor_weight_kg",
    _norm("SEP_SQLBowlVolumeLit"): "bowl_volume_lit",
    _norm("ejection system"): "ejection_system",
    _norm("power consumption TOTAL [kW]"): "power_consumption_total_kw",
}

# Safe float parser: handles "", "-", "n/a", commas, and spaces
def _to_float(val: Optional[str]) -> float:
    if val is None:
        return math.nan
    s = str(val).strip()
    if s in {"", "-", "—", "–", "n/a", "na", "none"}:
        return math.nan
    s = s.replace(" ", "").replace(",", ".")  # EU decimals -> dot
    # remove any non-numeric trailing units
    # keep digits, dot, +/-, and exponent 'e'
    filtered = "".join(ch for ch in s if ch.isdigit() or ch in ".+-eE")
    try:
        return float(filtered)
    except ValueError:
        return math.nan

def load_machines_from_csv(path: str) -> List[MachineData]:
    """
    Load machine data from CSV file and return list of MachineData objects.
    
    Args:
        path: Path to the CSV file
        
    Returns:
        List of MachineData objects
        
    Raises:
        FileNotFoundError: If the CSV file doesn't exist
    """
    p = pathlib.Path(path)
    if not p.exists():
        raise FileNotFoundError(f"CSV not found: {path}")

    with p.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        # Build a map from normalized header to original header in file
        file_headers_norm = {_norm(h): h for h in reader.fieldnames or []}

        machines: List[MachineData] = []
        for row in reader:
            # Helper to get a cell by *normalized* header safely
            def cell(csv_header_name: str) -> Optional[str]:
                key_norm = _norm(csv_header_name)
                src_header = file_headers_norm.get(key_norm)
                return None if src_header is None else (row.get(src_header))

            # Build kwargs for MachineData using HEADER_MAP
            kwargs: Dict[str, object] = {}
            for norm_header, field_name in HEADER_MAP.items():
                src_header = file_headers_norm.get(norm_header)
                raw = None if src_header is None else row.get(src_header)

                if field_name in {
                    "application",
                    "sub_application",
                    "drive_type",
                    "level",
                    "langtyp",
                    "protection_class",
                    "ejection_system",
                }:
                    kwargs[field_name] = (raw or "").strip()
                elif field_name == "motor_efficiency":
                    # Keep string like "≥ IE3", map "-" or empty to None
                    val = (raw or "").strip()
                    kwargs[field_name] = None if val in {"", "-", "—", "–"} else val
                else:
                    kwargs[field_name] = _to_float(raw)

            machines.append(MachineData(**kwargs))  # type: ignore[arg-type]

    return machines

def calculate_tco_for_machine(
    machine: MachineData,
    years: int = 5,
    electricity_eur_per_kwh: float = 0.25,
    water_eur_per_l: float = 0.002,
    training_cost: float = 0.0,
    label: Optional[str] = None,
    # Operation hours approach
    operation_hours_per_year: Optional[float] = None,
    # Throughput approach
    throughput_per_day: Optional[float] = None,
    workdays_per_week: int = 5,
    operation_hours_per_day: Optional[float] = None,
) -> TCO:
    """
    Calculate TCO for a single machine with given parameters.
    
    Args:
        machine: MachineData object
        years: Number of years for calculation
        electricity_eur_per_kwh: Electricity cost per kWh
        water_eur_per_l: Water cost per liter
        training_cost: Training cost for the machine
        label: Custom label for the TCO calculation
        operation_hours_per_year: Hours of operation per year (optional)
        throughput_per_day: Daily throughput in capacity units (optional)
        workdays_per_week: Number of workdays per week (1-7, default 5)
        operation_hours_per_day: Available operation hours per day (optional)
        
    Returns:
        TCO object with calculated costs
    """
    
    return machine.calculate_toc(
        years=years,
        electricity_eur_per_kwh=electricity_eur_per_kwh,
        water_eur_per_l=water_eur_per_l,
        training_cost=training_cost,
        label=label,
        operation_hours_per_year=operation_hours_per_year,
        throughput_per_day=throughput_per_day,
        workdays_per_week=workdays_per_week,
        operation_hours_per_day=operation_hours_per_day
    )

def compare_machines(
    machines: List[MachineData],
    years: int = 5,
    electricity_eur_per_kwh: float = 0.25,
    water_eur_per_l: float = 0.002,
    training_cost: float = 0.0,
    # Operation hours approach
    operation_hours_per_year: Optional[float] = None,
    # Throughput approach
    throughput_per_day: Optional[float] = None,
    workdays_per_week: int = 5,
    operation_hours_per_day: Optional[float] = None,
) -> List[TCO]:
    """
    Compare multiple machines by calculating TCO for each.
    
    Args:
        machines: List of MachineData objects
        years: Number of years for calculation
        electricity_eur_per_kwh: Electricity cost per kWh
        water_eur_per_l: Water cost per liter
        training_cost: Training cost for the machines
        operation_hours_per_year: Hours of operation per year (optional)
        throughput_per_day: Daily throughput in capacity units (optional)
        workdays_per_week: Number of workdays per week (1-7, default 5)
        operation_hours_per_day: Available operation hours per day (optional)
        
    Returns:
        List of TCO objects sorted by total cost (ascending)
    """
    tcos = []
    for machine in machines:
        tco = calculate_tco_for_machine(
            machine,
            years=years,
            electricity_eur_per_kwh=electricity_eur_per_kwh,
            water_eur_per_l=water_eur_per_l,
            training_cost=training_cost,
            operation_hours_per_year=operation_hours_per_year,
            throughput_per_day=throughput_per_day,
            workdays_per_week=workdays_per_week,
            operation_hours_per_day=operation_hours_per_day
        )
        tcos.append(tco)
    
    # Sort by total cost (ascending)
    return sorted(tcos, key=lambda t: t.total)

def save_machines_to_json(machines: List[MachineData], filepath: str) -> None:
    """
    Save machine data to JSON file.
    
    Args:
        machines: List of MachineData objects
        filepath: Path to save the JSON file
    """
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump([m.to_dict() for m in machines], f, ensure_ascii=False, indent=2)

def _machine_meets_project_constraints(machine: MachineData, project) -> bool:
    """
    Shared validation to decide if a machine configuration is legit for a given project.

    Rules:
    - Application and sub-application compatibility are handled in caller.
    - Solids percentage must be within machine's min/max range.
    - Throughput feasibility considering daily operation cap (20 h/day) when project provides daily throughput.
      If project provides customer_throughput_per_day > 0:
        - Required hours per day = throughput_per_day / capacity_max_inp
        - Must be <= 20 hours/day to be feasible
    - Protection class and motor efficiency must meet/exceed requirements.
    - Physical constraints: machine dimensions must fit within project's max length/width/height; weight <= maxWeight.
    """
    # Solids check
    if not (machine.feed_solids_min_vol_perc <= project.solids_percentage <= machine.feed_solids_max_vol_perc):
        return False

    # Throughput vs hours/day cap (20h)
    try:
        throughput_per_day = float(project.customer_throughput_per_day)
    except Exception:
        throughput_per_day = 0.0

    if throughput_per_day > 0:
        capacity_max = 0.0 if (machine.capacity_max_inp is None or math.isnan(machine.capacity_max_inp)) else float(machine.capacity_max_inp)
        if capacity_max <= 0:
            return False
        required_hours_per_day = throughput_per_day / capacity_max
        if required_hours_per_day > 20.0:
            return False

    # Protection class
    if not _protection_class_meets_requirement(machine.protection_class, project.protection_class):
        return False

    # Motor efficiency
    if not _motor_efficiency_meets_requirement(machine.motor_efficiency, project.motor_efficiency):
        return False

    # Physical constraints (allow zeros meaning no constraint)
    try:
        max_len = float(project.length_mm)
        max_wid = float(project.width_mm)
        max_hei = float(project.height_mm)
        max_weight = float(project.weight_kg)
    except Exception:
        max_len = max_wid = max_hei = max_weight = 0.0

    def is_positive(x: float) -> bool:
        return isinstance(x, (int, float)) and not math.isnan(x) and x > 0

    if is_positive(max_len) and machine.length_mm > max_len:
        return False
    if is_positive(max_wid) and machine.width_mm > max_wid:
        return False
    if is_positive(max_hei) and machine.height_mm > max_hei:
        return False
    if is_positive(max_weight) and machine.total_weight_kg > max_weight:
        return False

    return True

def filter_machines_for_project(machines: List[MachineData], project) -> List[MachineData]:
    """
    Filter machines based on project requirements.
    
    Filtering criteria:
    1. Application matches (case-insensitive)
    2. Sub-application matches (case-insensitive) 
    3. Solids percentage is within machine's range
    4. Throughput capacity can handle project requirements
    5. Protection class matches or is higher
    6. Motor efficiency matches or is higher
    
    Args:
        machines: List of MachineData objects to filter
        project: Project object with requirements
        
    Returns:
        List of MachineData objects that match project requirements
    """
    relevant_machines = []
    
    for machine in machines:
        # Check application match
        if (project.application.lower() not in machine.application.lower() and 
            machine.application.lower() not in project.application.lower()):
            continue
            
        # Check sub-application match
        if (project.sub_application.lower() not in machine.sub_application.lower() and
            machine.sub_application.lower() not in project.sub_application.lower()):
            continue

        # Shared comprehensive constraint check
        if not _machine_meets_project_constraints(machine, project):
            continue
        
        relevant_machines.append(machine)
    
    return relevant_machines

def _protection_class_meets_requirement(machine_class: str, project_class: str) -> bool:
    """Check if machine protection class meets project requirements."""
    if not machine_class or not project_class:
        return True  # If either is missing, assume it's acceptable
    
    # Simple string comparison for now - could be enhanced with proper IP rating logic
    return machine_class.lower() >= project_class.lower()

def _motor_efficiency_meets_requirement(machine_efficiency: Optional[str], project_efficiency: Optional[str]) -> bool:
    """Check if machine motor efficiency meets project requirements."""
    if not project_efficiency:
        return True  # If project has no requirement, any machine is acceptable
    
    if not machine_efficiency:
        return False  # If machine has no efficiency rating, it doesn't meet requirements
    
    # Simple string comparison for efficiency classes
    efficiency_order = ["ie1", "ie2", "ie3", "ie4", "ie5"]
    try:
        machine_ie = next(i for i, eff in enumerate(efficiency_order) if eff in machine_efficiency.lower())
        project_ie = next(i for i, eff in enumerate(efficiency_order) if eff in project_efficiency.lower())
        return machine_ie >= project_ie
    except StopIteration:
        return True  # If we can't parse the efficiency, assume it's acceptable

# --- Example usage ---
if __name__ == "__main__":
    print("=== GEA Sales TCO Calculation Engine ===\n")
    
    # Load machines from CSV
    try:
        machines = load_machines_from_csv(r"C:\Cursor\GEA_sales\backend\src\calculation_engine\machines.csv")
        print(f"✅ Loaded {len(machines)} machines from CSV")
    except FileNotFoundError as e:
        print(f"❌ Error loading CSV: {e}")
        exit(1)
    
    if not machines:
        print("❌ No machines found in CSV file")
        exit(1)
    
    # Display first machine details
    print(f"\n📋 First machine details:")
    print(f"   Application: {machines[0].application}")
    print(f"   Sub-Application: {machines[0].sub_application}")
    print(f"   DMR: {machines[0].dmr} mm")
    print(f"   List Price: €{machines[0].list_price:,.2f}")
    print(f"   Power Consumption: {machines[0].power_consumption_total_kw} kW")
    print(f"   Drive Type: {machines[0].drive_type}")
    
    # Example TCO calculation
    print(f"\n💰 TCO Calculation Example:")
    print("   Parameters:")
    print("   - Operation: 8,000 hours/year")
    print("   - Duration: 5 years")
    print("   - Electricity: €0.25/kWh")
    print("   - Water: €0.002/L")
    
    # Calculate TCO for first machine using operation hours
    tco = calculate_tco_for_machine(
        machines[0],
        operation_hours_per_year=8000
    )
    
    print(f"\n📊 TCO Results for '{tco.label}':")
    print(f"   Acquisition Cost (Ca): €{tco.ca:,.2f}")
    print(f"   Commissioning Cost (Cc): €{tco.cc:,.2f}")
    print(f"   Operating Cost (Co): €{tco.co:,.2f}")
    print(f"   Maintenance Cost (Cm): €{tco.cm:,.2f}")
    print(f"   Total Cost of Ownership: €{tco.total:,.2f}")
    
    # Show monthly progression (first 12 months)
    print(f"\n📈 Monthly Cumulative Total (first 12 months):")
    for i, cost in enumerate(tco.monthly_cum_total[:12]):
        print(f"   Month {i:2d}: €{cost:10,.2f}")
    if len(tco.monthly_cum_total) > 12:
        print(f"   ... (showing first 12 of {len(tco.monthly_cum_total)} months)")
    
    # Compare multiple machines
    print(f"\n🔍 Comparing first 3 machines:")
    comparison_tcos = compare_machines(
        machines[:3],
        operation_hours_per_year=8000
    )
    for i, tco in enumerate(comparison_tcos):
        print(f"   {i+1}. {tco.label}: €{tco.total:,.2f}")
    
    # Find best value machine
    if comparison_tcos:
        best_value = comparison_tcos[0]  # Already sorted by total cost
        print(f"\n🏆 Best Value: {best_value.label} at €{best_value.total:,.2f}")
    
    # Example throughput-based calculation
    print(f"\n🔄 Throughput-Based Calculation Example:")
    print("   Parameters:")
    print("   - Throughput: 1000 units/day")
    print("   - Workdays: 5 days/week")
    print("   - Max operation: 12 hours/day")
    print("   - Duration: 5 years")
    
    if machines:
        throughput_tco = calculate_tco_for_machine(
            machines[0],
            throughput_per_day=1000,
            workdays_per_week=5,
            operation_hours_per_day=12
        )
        
        print(f"\n📊 Throughput TCO Results for '{throughput_tco.label}':")
        print(f"   Total Cost of Ownership: €{throughput_tco.total:,.2f}")
        print(f"   (Based on {1000} units/day throughput)")
    
    # Save results to JSON
    try:
        save_machines_to_json(machines, "machines.json")
        print(f"\n💾 Saved machine data to machines.json")
    except Exception as e:
        print(f"\n❌ Error saving JSON: {e}")
    
    print(f"\n=== Example Complete ===")