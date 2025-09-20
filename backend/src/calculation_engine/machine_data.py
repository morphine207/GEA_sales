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
        electricity_eur_per_kwh: float,
        water_eur_per_l: float,
        commissioning_pct: float = 0.10,
        extra_maint_pct: float = 0.00,
        label: Optional[str] = None,
        # Operation hours approach
        operation_hours_per_year: Optional[float] = None,
        # Throughput approach
        throughput_per_day: Optional[float] = None,
        workdays_per_week: int = 5,
        operation_hours_per_day: Optional[float] = None,
    ):
        """
        Build a TCO object using the same rules as your pandas simulator:
        - Upfront at month 0: Ca = Listprice, Cc = Listprice * commissioning_pct,
          Cm starts at (Listprice * extra_maint_pct)
        - Monthly operating cost Co from power and water
        - Service at the earlier of every 8000 hours OR 24 months
        - +€2000 per service for flat-belt drives
        
        Operation calculation:
        - If operation_hours_per_year is provided, use it directly
        - If throughput_per_day is provided, calculate hours based on capacity:
          * Calculate required hours per day = throughput_per_day / capacity_max_inp
          * Calculate hours per year = required_hours_per_day * workdays_per_week * 52
        - If operation_hours_per_day is provided, use it for daily hours calculation
        
        Returns: TCO(monthly_cum_total starting with month 0, and final ca/cc/co/cm)
        """
        # Handle imports for both module and direct execution
        try:
            from .tco import TCO
        except ImportError:
            from tco import TCO
        
        # Calculate operation hours per year based on provided parameters
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
        
        # Label (fallback similar to make_label)
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

        months = int(years) * 12
        hrs_per_month = float(hrs_per_year) / 12.0

        power_kw   = 0.0 if (self.power_consumption_total_kw is None or math.isnan(self.power_consumption_total_kw)) else float(self.power_consumption_total_kw)
        water_lps  = 0.0 if (self.op_water_l_s is None or math.isnan(self.op_water_l_s)) else float(self.op_water_l_s)
        water_lpej = 0.0 if (self.op_water_l_it_eject is None or math.isnan(self.op_water_l_it_eject)) else float(self.op_water_l_it_eject)
        dmr_mm     = float('nan') if (self.dmr is None or (isinstance(self.dmr, float) and math.isnan(self.dmr))) else float(self.dmr)
        listprice  = 0.0 if (self.list_price is None or math.isnan(self.list_price)) else float(self.list_price)
        drive_str  = (self.drive_type or "").lower()

        # Upfront costs at month 0
        Ca = listprice
        Cc_upfront = listprice * float(commissioning_pct)
        extra_maint_upfront = listprice * float(extra_maint_pct)

        # Service tracking
        base_service_cost = self.service_price_from_dmr(dmr_mm)
        hours_since_service = 0.0
        months_since_service = 0

        # Extra maintenance per service for flat-belt drives
        is_flat_belt = ("flat" in drive_str) and ("belt" in drive_str)
        drivetype_extra_per_service = 2000.0 if is_flat_belt else 0.0

        # Cumulative trackers
        cum_Ca = Ca
        cum_Cc = Cc_upfront
        cum_Co = 0.0
        cum_Cm = extra_maint_upfront

        monthly_cum_total: List[float] = []
        # Month 0 record
        monthly_cum_total.append(cum_Ca + cum_Cc + cum_Co + cum_Cm)

        # Iterate months 1..N
        for _m in range(1, months + 1):
            # Operating costs this month
            energy_kwh = power_kw * hrs_per_month
            water_l_from_flow = water_lps * (hrs_per_month * 3600.0)

            Co_month = (energy_kwh * float(electricity_eur_per_kwh)) + \
                       (water_l_from_flow * float(water_eur_per_l))
            cum_Co += Co_month

            # Accumulate counters towards service
            hours_since_service  += hrs_per_month
            months_since_service += 1

            # Service trigger: earliest of 8000 hours or 24 months
            need_service = (hours_since_service >= 8000.0) or (months_since_service >= 24)

            if need_service:
                cum_Cm += base_service_cost + drivetype_extra_per_service
                hours_since_service = 0.0
                months_since_service = 0

            monthly_cum_total.append(cum_Ca + cum_Cc + cum_Co + cum_Cm)

        # Build TCO object
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
        if dmr_mm is None or (isinstance(dmr_mm, float) and math.isnan(dmr_mm)):
            return 15000.0
        if dmr_mm < 400:
            return 10000.0
        if dmr_mm <= 700:
            return 15000.0
        return 20000.0
