import { Project, Machine } from "@/types/project";
import { ComprehensiveMachine } from "@/types/tco";

export const mockProjects: Project[] = [
  {
    id: '1',
    projectName: 'PROJECT 1',
    company: 'Acme Wine Corp',
    contact: 'John Smith',
    telephone: '+49 123 456 789',
    mail: 'john.smith@acmewine.com',
    application: 'Wine',
    subApplication: 'Clarific. of Sparkling Wine',
    feedSolid: 0.4,
    capacityPerDay: 1500,
    protectionClass: 'IP65',
    motorEfficiency: '95%',
    maxWidth: 2500,
    maxLength: 3000,
    maxHeight: 2200,
    maxWeight: 850,
    tcoTotal: 125000,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    machines: [
      {
        id: '1-1',
        projectId: '1',
        name: 'GFA 40-87-600', // Wine machine from specifications
        listPrice: 112631,
        totalOperationCosts: 5200, // Based on 8.4kW power consumption
        totalMaintenanceCosts: 9000, // 8% of list price
        tco: 126831
      },
      {
        id: '1-2',
        projectId: '1',
        name: 'GFA 40-12-596', // Different wine machine from specifications
        listPrice: 143642,
        totalOperationCosts: 9200, // Based on 14.8kW power consumption
        totalMaintenanceCosts: 11500, // 8% of list price
        tco: 164342
      }
    ]
  },
  {
    id: '2',
    projectName: 'PROJECT 2',
    company: 'Bavarian Brewery',
    contact: 'Maria Mueller',
    telephone: '+49 987 654 321',
    mail: 'maria.mueller@bavarianbrew.de',
    application: 'Beer',
    subApplication: 'Clarification of Kwass',
    feedSolid: 0.3,
    capacityPerDay: 2200,
    protectionClass: 'IP54',
    motorEfficiency: '92%',
    maxWidth: 3000,
    maxLength: 3500,
    maxHeight: 2800,
    maxWeight: 1200,
    tcoTotal: 185000,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
    machines: [
      {
        id: '2-1',
        projectId: '2',
        name: 'GFA 200-98-270', // Beer machine from specifications
        listPrice: 307128,
        totalOperationCosts: 27500, // Based on 44kW power consumption
        totalMaintenanceCosts: 24600, // 8% of list price
        tco: 359228
      },
      {
        id: '2-2',
        projectId: '2',
        name: 'GFA 200-18-944', // Different beer machine from specifications
        listPrice: 349252,
        totalOperationCosts: 27500, // Based on 44kW power consumption
        totalMaintenanceCosts: 27900, // 8% of list price
        tco: 404652
      }
    ]
  },
  {
    id: '3',
    projectName: 'PROJECT 3',
    company: 'Alpine Distillery',
    contact: 'Hans Weber',
    telephone: '+41 555 123 456',
    mail: 'hans.weber@alpinedist.ch',
    application: 'Tea',
    subApplication: 'Clarification of RTD Tea',
    feedSolid: 0.3,
    capacityPerDay: 800,
    protectionClass: 'IP65',
    motorEfficiency: '94%',
    maxWidth: 2000,
    maxLength: 2500,
    maxHeight: 2000,
    maxWeight: 650,
    tcoTotal: 95000,
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-15'),
    machines: [
      {
        id: '3-1',
        projectId: '3',
        name: 'GFA 10-50-645', // Tea machine (can be used for spirits too)
        listPrice: 79612,
        totalOperationCosts: 3700, // Based on 6kW power consumption
        totalMaintenanceCosts: 6400, // 8% of list price
        tco: 89712
      },
      {
        id: '3-2',
        projectId: '3',
        name: 'GFA 100-14-242', // Tea processing machine
        listPrice: 207913,
        totalOperationCosts: 22500, // Based on 36kW power consumption
        totalMaintenanceCosts: 16600, // 8% of list price
        tco: 247013
      }
    ]
  },
  {
    id: '4',
    projectName: 'PROJECT 4',
    company: 'Mediterranean Oils',
    contact: 'Sofia Rossi',
    telephone: '+39 333 789 012',
    mail: 'sofia.rossi@medoils.it',
    application: 'Fruit Juice',
    subApplication: 'Fruit Juice',
    feedSolid: 3,
    capacityPerDay: 1800,
    protectionClass: 'IP54',
    motorEfficiency: '93%',
    maxWidth: 2800,
    maxLength: 3200,
    maxHeight: 2400,
    maxWeight: 950,
    tcoTotal: 155000,
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-25'),
    machines: [
      {
        id: '4-1',
        projectId: '4',
        name: 'GFA 200-69-517', // Fruit juice machine (suitable for oils)
        listPrice: 338917,
        totalOperationCosts: 27500, // Based on 44kW power consumption
        totalMaintenanceCosts: 27100, // 8% of list price
        tco: 393517
      },
      {
        id: '4-2',
        projectId: '4',
        name: 'GFA 200-78-266', // Fruit juice processing machine
        listPrice: 331419,
        totalOperationCosts: 27500, // Based on 44kW power consumption
        totalMaintenanceCosts: 26500, // 8% of list price
        tco: 385419
      }
    ]
  }
];

// Example comprehensive machines with full TCO breakdown
export const mockComprehensiveMachines: ComprehensiveMachine[] = [
  {
    id: 'comp-1',
    projectId: '1',
    name: 'MACHINE 1 (COMPREHENSIVE)',
    acquisition: {
      list_price_eur: 45000,
      discount_rate: 0.05 // 5% discount
    },
    commissioning: {
      total_weight_kg: 1200,
      needs_training: true
    },
    operating: {
      power_kW: 18.5,
      energy_price: 0.156,
      op_water_L_per_s: 0.8,
      op_water_per_ejection_L: 2.5,
      water_price: 1.60,
      hours_per_day: 16,
      days_per_week: 5,
      weeks_per_year: 50,
      drive_type: 'standard',
      motor_efficiency_class: 'IE3+',
      number_of_ejections_per_hour: 80
    },
    maintenance: {
      bowl_diameter_mm: 550,
      drive_type: 'standard',
      operating_hours_per_year: 4000
    },
    production_impact: {
      cleaning_interval_h: 8,
      cleaning_time_h: 1.5,
      bowl_volume_L: 75,
      cleaning_media_price: 1.8,
      planned_shutdowns_per_year: 24,
      throughput_L_per_h: 1200,
      product_value_per_L: 0.8,
      unplanned_downtime_rate: 0.002,
      mttr_hours: 3,
      ejection_system: 'advanced'
    },
    disposal: {
      total_weight_kg: 1200
    },
    end_of_life: {
      residual_weight_kg: 600,
      scrap_value_rate: 0.60
    },
    tco_components: {
      Ca_acquisition: 45000,
      Cc_commissioning: 16000,
      Co_operating: 28000,
      Cm_maintenance: 18000,
      Cp_production_impact: 15000,
      Cd_disposal: 3600,
      Ve_end_of_life: 360,
      total_before_discount: 125240,
      discount_amount: 6262,
      total_after_discount: 118978
    },
    tco_total: 118978
  }
];