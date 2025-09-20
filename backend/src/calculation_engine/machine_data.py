from dataclasses import dataclass, asdict
from typing import Any, Optional, List, Dict
import math

@dataclass
class MachineData:
    application: str
    sub_application: str
    feed_solids_min_vol_perc: float
    feed_solids_max_vol_perc: float
    capacity_min_inp: float
    capacity_max_inp: float
    drive_type: str
    level: str
    langtyp: str
    dmr: float
    list_price: float
    motor_power_kw: float
    protection_class: str
    motor_efficiency: Optional[str]  # e.g., "≥ IE3" or None
    op_water_supply_bar: float
    op_water_l_s: float
    op_water_l_it_eject: float
    length_mm: float
    width_mm: float
    height_mm: float
    total_weight_kg: float
    bowl_weight_kg: float
    motor_weight_kg: float
    bowl_volume_lit: float
    ejection_system: str
    power_consumption_total_kw: float

    def to_dict(self) -> dict:
        return asdict(self)

    def calculate_toc(
        self,
        *,
        years: int,
        electricity_eur_per_kwh: float = 0.156,
        water_eur_per_l: float = 0.0016,
        training_cost: float = 0.0,
        construction_cost_per_kg: float = 5.0,
        cost_cleaning_eur_per_lit: float = 0.5,
        unplanned_downtime: float = 0.02,
        label: Optional[str] = None,
        # Operation hours approach
        operation_hours_per_year: Optional[float] = None,
        # Throughput approach
        throughput_per_day: Optional[float] = None,
        workdays_per_week: int = 5,
        operation_hours_per_day: Optional[float] = None,
    ):
        """
        Calculate Total Cost of Ownership (TCO) for the machine over specified years.
        
        Cost Categories:
        ================
        
        Ca - ACQUISITION COSTS (One-time, Month 0):
        - Machine list price
        
        Cc - COMMISSIONING COSTS (One-time, Month 0):
        - Training costs
        - Construction costs (cost per kg × machine weight)
        
        Co - OPERATING COSTS (Monthly):
        - Electricity consumption (power × hours × electricity rate)
        - Water consumption (flow rate × hours × water rate)
        - Cleaning costs (every 10 hours, 2 hours downtime + cleaning agent costs)
        - Efficiency factors applied to power consumption
        
        Cm - MAINTENANCE COSTS (Periodic):
        - Base service cost based on DMR size
        - Additional €2000 per service for flat-belt drives
        - Service triggers: 8000 hours OR 24 months (whichever comes first)
        - Efficiency factors: flat-belt drives (+1% energy), IE3 efficiency (-1% energy)
        
        Operation Hours Calculation:
        ===========================
        - If operation_hours_per_year provided: use directly
        - If throughput_per_day provided: calculate based on machine capacity
        - If operation_hours_per_day provided: use for daily calculation
        
        Returns: TCO object with monthly cumulative totals and final cost breakdown
        """
        # Handle imports for both module and direct execution
        try:
            from .tco import TCO
        except ImportError:
            from tco import TCO
        
        # ============================================================================
        # OPERATION HOURS CALCULATION
        # ============================================================================
        
        if operation_hours_per_year is not None:
            # Use provided operation hours directly
            hrs_per_year = operation_hours_per_year
        elif throughput_per_day is not None:
            # Calculate based on throughput and capacity
            capacity_max = self.capacity_max_inp if not math.isnan(self.capacity_max_inp) else 0.0
            if capacity_max <= 0:
                raise ValueError(f"Invalid capacity_max_inp: {capacity_max}. Cannot calculate operation hours from throughput.")
            
            # Calculate required hours per day based on throughput
            required_hours_per_day = throughput_per_day / capacity_max
            
            # If operation_hours_per_day is provided, use the minimum of required and available hours
            if operation_hours_per_day is not None:
                actual_hours_per_day = min(required_hours_per_day, operation_hours_per_day)
            else:
                actual_hours_per_day = required_hours_per_day
            
            # Calculate hours per year
            hrs_per_year = actual_hours_per_day * workdays_per_week * 52
        elif operation_hours_per_day is not None:
            # Use daily hours directly
            hrs_per_year = operation_hours_per_day * workdays_per_week * 52
        else:
            raise ValueError("Must provide either operation_hours_per_year, throughput_per_day, or operation_hours_per_day")
        
        # Generate label if not provided
        if not label:
            parts = []
            if self.application:
                parts.append(self.application.strip())
            if self.sub_application:
                parts.append(self.sub_application.strip())
            if self.dmr is not None and not (isinstance(self.dmr, float) and math.isnan(self.dmr)):
                try:
                    parts.append(f"DMR {int(float(self.dmr))} mm")
                except Exception:
                    parts.append(f"DMR {self.dmr}")
            label = " – ".join(parts) if parts else "Machine"

        # ============================================================================
        # INITIALIZATION AND DATA PREPARATION
        # ============================================================================
        
        months = int(years) * 12
        hrs_per_month = float(hrs_per_year) / 12.0

        # Extract and validate machine specifications
        power_kw = 0.0 if (self.power_consumption_total_kw is None or math.isnan(self.power_consumption_total_kw)) else float(self.power_consumption_total_kw)
        water_lps = 0.0 if (self.op_water_l_s is None or math.isnan(self.op_water_l_s)) else float(self.op_water_l_s)
        water_lpej = 0.0 if (self.op_water_l_it_eject is None or math.isnan(self.op_water_l_it_eject)) else float(self.op_water_l_it_eject)
        dmr_mm = float('nan') if (self.dmr is None or (isinstance(self.dmr, float) and math.isnan(self.dmr))) else float(self.dmr)
        listprice = 0.0 if (self.list_price is None or math.isnan(self.list_price)) else float(self.list_price)
        drive_str = (self.drive_type or "").lower()

        # ============================================================================
        # Ca - ACQUISITION COSTS (One-time, Month 0)
        # ============================================================================
        
        Ca = listprice  # Machine acquisition cost

        # ============================================================================
        # Cc - COMMISSIONING COSTS (One-time, Month 0)
        # ============================================================================
        
        # Training costs
        training_total = training_cost
        
        # Construction costs (cost per kg × machine weight)
        construction_total = construction_cost_per_kg * self.total_weight_kg
        
        Cc = training_total + construction_total

        # ============================================================================
        # Cm - MAINTENANCE COSTS (Periodic)
        # ============================================================================
        
        # Base service cost based on DMR size
        base_service_cost = self.service_price_from_dmr(dmr_mm)
        
        # Additional cost for flat-belt drives
        is_flat_belt = ("flat" in drive_str) and ("belt" in drive_str)
        drivetype_extra_per_service = 2000.0 if is_flat_belt else 0.0
        
        # Service tracking variables
        hours_since_service = 0.0
        months_since_service = 0
        
        # Cleaning tracking variables
        hours_since_cleaning = 0.0

        # ============================================================================
        # Co - OPERATING COSTS (Monthly)
        # ============================================================================
        
        # Apply efficiency factors to power consumption
        efficiency_factor = 1.0
        
        # Flat-belt drives: +1% energy consumption
        if is_flat_belt:
            efficiency_factor += 0.01
        
        # IE3 efficiency: -1% energy consumption
        if self.motor_efficiency and "IE3" in str(self.motor_efficiency).upper():
            efficiency_factor -= 0.01
        
        # Apply efficiency factor to power consumption
        adjusted_power_kw = power_kw * efficiency_factor
        
        # Calculate cleaning costs
        # Every 10 hours: 2 hours downtime + cleaning agent costs
        cleaning_interval_hours = 10.0
        cleaning_downtime_hours = 2.0
        cleaning_cost_per_cycle = self.bowl_volume_lit * cost_cleaning_eur_per_lit
        
        # Calculate unplanned downtime costs
        # 2% of operation hours per year
        unplanned_downtime_hours_per_year = hrs_per_year * unplanned_downtime
        # Note: Unplanned downtime cost would need production value per hour
        # For now, we'll track the downtime hours but not apply a cost

        # ============================================================================
        # CUMULATIVE COST TRACKING
        # ============================================================================
        
        cum_Ca = Ca
        cum_Cc = Cc
        cum_Co = 0.0
        cum_Cm = 0.0

        monthly_cum_total: List[float] = []
        # Month 0: Record upfront costs
        monthly_cum_total.append(cum_Ca + cum_Cc + cum_Co + cum_Cm)

        # ============================================================================
        # MONTHLY ITERATION (Months 1 to N)
        # ============================================================================
        
        for _m in range(1, months + 1):
            # Co - OPERATING COSTS (Monthly)
            # ===============================
            
            # Calculate effective operation hours (accounting for cleaning downtime)
            effective_hrs_per_month = hrs_per_month
            
            # Check for cleaning requirement
            hours_since_cleaning += hrs_per_month
            cleaning_cycles_this_month = 0
            
            while hours_since_cleaning >= cleaning_interval_hours:
                # Apply cleaning cost
                cum_Co += cleaning_cost_per_cycle
                cleaning_cycles_this_month += 1
                hours_since_cleaning -= cleaning_interval_hours
                
                # Reduce effective operation hours by cleaning downtime
                effective_hrs_per_month -= cleaning_downtime_hours
            
            # Ensure effective hours don't go negative
            effective_hrs_per_month = max(0.0, effective_hrs_per_month)
            
            # Electricity costs (using adjusted power consumption)
            energy_kwh = adjusted_power_kw * effective_hrs_per_month
            electricity_cost = energy_kwh * float(electricity_eur_per_kwh)
            
            # Water costs (from continuous flow, using effective hours)
            water_l_from_flow = water_lps * (effective_hrs_per_month * 3600.0)
            water_cost = water_l_from_flow * float(water_eur_per_l)
            
            # Monthly operating cost
            Co_month = electricity_cost + water_cost
            cum_Co += Co_month

            # Cm - MAINTENANCE COSTS (Periodic)
            # ==================================
            
            # Accumulate service counters (using effective hours)
            hours_since_service += effective_hrs_per_month
            months_since_service += 1

            # Service trigger: earliest of 8000 hours OR 24 months
            need_service = (hours_since_service >= 8000.0) or (months_since_service >= 24)

            if need_service:
                # Apply service cost
                service_cost = base_service_cost + drivetype_extra_per_service
                cum_Cm += service_cost
                
                # Reset service counters
                hours_since_service = 0.0
                months_since_service = 0

            # Record cumulative total for this month
            monthly_cum_total.append(cum_Ca + cum_Cc + cum_Co + cum_Cm)

        # ============================================================================
        # RETURN TCO OBJECT
        # ============================================================================
        
        return TCO(
            label=label,
            monthly_cum_total=monthly_cum_total,
            ca=cum_Ca,
            cc=cum_Cc,
            co=cum_Co,
            cm=cum_Cm,
        )

    def service_price_from_dmr(self, dmr_mm: float) -> float:
        """
        DMR bands:
        < 400 mm  -> €10,000
        400–700mm -> €15,000
        > 700 mm  -> €20,000
        """
        if dmr_mm < 400:
            return 10000.0
        if dmr_mm <= 700:
            return 15000.0
        return 20000.0
