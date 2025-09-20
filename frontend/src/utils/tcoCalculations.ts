import { 
  ComprehensiveMachine, 
  TCOComponents, 
  AcquisitionCost,
  CommissioningCost,
  OperatingCost,
  MaintenanceCost,
  ProductionImpactCost,
  DisposalCost,
  EndOfLifeValue
} from '@/types/tco';

export function calculateAcquisitionCost(data: AcquisitionCost): number {
  return data.list_price_eur;
}

export function calculateCommissioningCost(data: CommissioningCost): number {
  const construction_cost = 5 * data.total_weight_kg; // 5 €/kg
  const training_cost = data.needs_training ? 10000 : 0; // €10,000 if training needed
  return construction_cost + training_cost;
}

export function calculateOperatingCost(data: OperatingCost): number {
  const operating_hours = data.hours_per_day * data.days_per_week * data.weeks_per_year;
  
  // Energy cost calculation
  let energy_multiplier = 1.0;
  if (data.drive_type === 'flat-belt') energy_multiplier += 0.01; // +1% for flat-belt
  if (data.motor_efficiency_class === 'IE3+') energy_multiplier -= 0.01; // -1% for IE3+
  
  const energy_kWh = data.power_kW * operating_hours * energy_multiplier;
  const energy_cost = energy_kWh * data.energy_price;
  
  // Water cost calculation
  const water_flow_cost = data.op_water_L_per_s * 3600 * operating_hours * (data.water_price / 1000); // Convert €/m³ to €/L
  const water_ejection_cost = data.op_water_per_ejection_L * (data.number_of_ejections_per_hour || 0) * operating_hours * (data.water_price / 1000);
  
  return energy_cost + water_flow_cost + water_ejection_cost;
}

export function calculateMaintenanceCost(data: MaintenanceCost): number {
  // Service tier based on bowl diameter
  let base_service_cost = 10000; // <400mm
  if (data.bowl_diameter_mm >= 400 && data.bowl_diameter_mm <= 700) {
    base_service_cost = 15000;
  } else if (data.bowl_diameter_mm > 700) {
    base_service_cost = 20000;
  }
  
  // Drive type adder
  const drive_adder = data.drive_type === 'flat-belt' ? 2000 : 0;
  
  // Service frequency
  const services_per_year = Math.max(data.operating_hours_per_year / 8000, 0.5);
  
  return (base_service_cost + drive_adder) * services_per_year;
}

export function calculateProductionImpactCost(data: ProductionImpactCost, operating_hours: number): number {
  // Cleaning costs
  const cleanings_per_year = (operating_hours / data.cleaning_interval_h) + data.planned_shutdowns_per_year;
  const cleaning_agent_cost = data.bowl_volume_L * cleanings_per_year * data.cleaning_media_price;
  const cleaning_downtime_hours = cleanings_per_year * data.cleaning_time_h;
  const cleaning_downtime_loss = cleaning_downtime_hours * data.throughput_L_per_h * data.product_value_per_L;
  
  // Unplanned downtime
  const unplanned_events_per_year = operating_hours * data.unplanned_downtime_rate;
  const unplanned_downtime_hours = unplanned_events_per_year * data.mttr_hours;
  const unplanned_downtime_loss = unplanned_downtime_hours * data.throughput_L_per_h * data.product_value_per_L;
  
  return cleaning_agent_cost + cleaning_downtime_loss + unplanned_downtime_loss;
}

export function calculateDisposalCost(data: DisposalCost): number {
  return 3 * data.total_weight_kg; // 3 €/kg
}

export function calculateEndOfLifeValue(data: EndOfLifeValue): number {
  return data.residual_weight_kg * data.scrap_value_rate;
}

export function calculateComprehensiveTCO(machine: ComprehensiveMachine): TCOComponents {
  const operating_hours = machine.operating.hours_per_day * machine.operating.days_per_week * machine.operating.weeks_per_year;
  
  const Ca_acquisition = calculateAcquisitionCost(machine.acquisition);
  const Cc_commissioning = calculateCommissioningCost(machine.commissioning);
  const Co_operating = calculateOperatingCost(machine.operating);
  const Cm_maintenance = calculateMaintenanceCost(machine.maintenance);
  const Cp_production_impact = calculateProductionImpactCost(machine.production_impact, operating_hours);
  const Cd_disposal = calculateDisposalCost(machine.disposal);
  const Ve_end_of_life = calculateEndOfLifeValue(machine.end_of_life);
  
  const total_before_discount = Ca_acquisition + Cc_commissioning + Co_operating + Cm_maintenance + Cp_production_impact + Cd_disposal - Ve_end_of_life;
  const discount_amount = total_before_discount * machine.acquisition.discount_rate;
  const total_after_discount = total_before_discount - discount_amount;
  
  return {
    Ca_acquisition,
    Cc_commissioning,
    Co_operating,
    Cm_maintenance,
    Cp_production_impact,
    Cd_disposal,
    Ve_end_of_life,
    total_before_discount,
    discount_amount,
    total_after_discount
  };
}

// Backward compatibility function to convert old simple machines to new format
export function convertSimpleMachineToComprehensive(simpleMachine: any): ComprehensiveMachine {
  return {
    id: simpleMachine.id,
    projectId: simpleMachine.projectId,
    name: simpleMachine.name,
    acquisition: {
      list_price_eur: simpleMachine.listPrice || 45000,
      discount_rate: 0.0
    },
    commissioning: {
      total_weight_kg: 1000,
      needs_training: false
    },
    operating: {
      power_kW: 15,
      energy_price: 0.156,
      op_water_L_per_s: 0.5,
      op_water_per_ejection_L: 2,
      water_price: 1.60,
      hours_per_day: 16,
      days_per_week: 5,
      weeks_per_year: 50,
      drive_type: 'standard',
      motor_efficiency_class: 'IE3',
      number_of_ejections_per_hour: 60
    },
    maintenance: {
      bowl_diameter_mm: 500,
      drive_type: 'standard',
      operating_hours_per_year: 4000
    },
    production_impact: {
      cleaning_interval_h: 10,
      cleaning_time_h: 2,
      bowl_volume_L: 50,
      cleaning_media_price: 1.5,
      planned_shutdowns_per_year: 12,
      throughput_L_per_h: 1000,
      product_value_per_L: 0.5,
      unplanned_downtime_rate: 0.002,
      mttr_hours: 4,
      ejection_system: 'standard'
    },
    disposal: {
      total_weight_kg: 1000
    },
    end_of_life: {
      residual_weight_kg: 500,
      scrap_value_rate: 0.60
    },
    tco_components: {
      Ca_acquisition: 0,
      Cc_commissioning: 0,
      Co_operating: 0,
      Cm_maintenance: 0,
      Cp_production_impact: 0,
      Cd_disposal: 0,
      Ve_end_of_life: 0,
      total_before_discount: 0,
      discount_amount: 0,
      total_after_discount: 0
    },
    tco_total: simpleMachine.tco || 0
  };
}