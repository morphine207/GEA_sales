// Comprehensive TCO calculation types based on the provided formula
// TCO = Ca + Cc + Co + Cm + Cp + Cd - Ve

export interface AcquisitionCost {
  list_price_eur: number;
  discount_rate: number; // 0-1 (e.g., 0.1 for 10%)
}

export interface CommissioningCost {
  total_weight_kg: number;
  needs_training: boolean;
}

export interface OperatingCost {
  power_kW: number;
  energy_price: number; // €0.156 per kWh default
  op_water_L_per_s: number;
  op_water_per_ejection_L: number;
  water_price: number; // €1.60 per m³ default
  hours_per_day: number;
  days_per_week: number;
  weeks_per_year: number;
  drive_type: 'standard' | 'flat-belt';
  motor_efficiency_class: 'IE1' | 'IE2' | 'IE3' | 'IE3+';
  number_of_ejections_per_hour: number;
}

export interface MaintenanceCost {
  bowl_diameter_mm: number;
  drive_type: 'standard' | 'flat-belt';
  operating_hours_per_year: number;
}

export interface ProductionImpactCost {
  // Cleaning costs
  cleaning_interval_h: number; // Default: 10h
  cleaning_time_h: number; // Default: 2h
  bowl_volume_L: number;
  cleaning_media_price: number; // €0.5-2 per L
  planned_shutdowns_per_year: number;
  
  // Production parameters
  throughput_L_per_h: number;
  product_value_per_L: number;
  
  // Unplanned downtime
  unplanned_downtime_rate: number; // 0.002 for GEA (0.2%), 0.003 for competitor (0.3%)
  mttr_hours: number; // Mean time to repair
  ejection_system: 'standard' | 'advanced';
}

export interface DisposalCost {
  total_weight_kg: number;
}

export interface EndOfLifeValue {
  residual_weight_kg: number;
  scrap_value_rate: number; // €0.60 per kg default
}

export interface TCOComponents {
  Ca_acquisition: number;
  Cc_commissioning: number;
  Co_operating: number;
  Cm_maintenance: number;
  Cp_production_impact: number;
  Cd_disposal: number;
  Ve_end_of_life: number;
  total_before_discount: number;
  discount_amount: number;
  total_after_discount: number;
}

export interface ComprehensiveMachine {
  id: string;
  projectId: string;
  name: string;
  
  // TCO calculation data
  acquisition: AcquisitionCost;
  commissioning: CommissioningCost;
  operating: OperatingCost;
  maintenance: MaintenanceCost;
  production_impact: ProductionImpactCost;
  disposal: DisposalCost;
  end_of_life: EndOfLifeValue;
  
  // Calculated results
  tco_components: TCOComponents;
  tco_total: number;
}