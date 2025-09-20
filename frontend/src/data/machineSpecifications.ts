// Machine specifications data from the uploaded Excel file
export interface MachineSpecification {
  application: string;
  subApplication: string;
  feedSolidsMin: number;
  feedSolidsMax: number;
  capacityMinInp: number;
  capacityMaxInp: number;
  driveType: string;
  level: string;
  modelNumber: string;
  bowlDiameter: number;
  listPrice: number;
  motorPowerKW: number;
  protectionClass: string;
  motorEfficiency: string;
  waterSupplyBar: number;
  waterFlowLs: number;
  waterPerEjectionL: number;
  length: number;
  width: number;
  height: number;
  totalWeightKg: number;
  bowlWeightKg: number;
  motorWeightKg: number;
  bowlVolumeL: number;
  ejectionSystem: string;
  powerConsumptionTotalKW: number;
}

export const machineSpecifications: MachineSpecification[] = [
  {
    application: "Citrus",
    subApplication: "Citrus Juice Clarification",
    feedSolidsMin: 10,
    feedSolidsMax: 12,
    capacityMinInp: 11000,
    capacityMaxInp: 15000,
    driveType: "integrated direct drive",
    level: "premium - Level",
    modelNumber: "GFA 200-30-820",
    bowlDiameter: 810,
    listPrice: 344261,
    motorPowerKW: 55,
    protectionClass: "IP00",
    motorEfficiency: "-",
    waterSupplyBar: 2.5,
    waterFlowLs: 1.2,
    waterPerEjectionL: 11.0,
    length: 1480,
    width: 1730,
    height: 2070,
    totalWeightKg: 3100,
    bowlWeightKg: 1400,
    motorWeightKg: 0,
    bowlVolumeL: 69,
    ejectionSystem: "HydroStop",
    powerConsumptionTotalKW: 44
  },
  {
    application: "Citrus",
    subApplication: "Citrus Juice Clarification",
    feedSolidsMin: 3,
    feedSolidsMax: 5,
    capacityMinInp: 7000,
    capacityMaxInp: 10000,
    driveType: "flat-belt drive",
    level: "standard - Level",
    modelNumber: "GFA 100-69-357",
    bowlDiameter: 660,
    listPrice: 234070,
    motorPowerKW: 45,
    protectionClass: "IP55",
    motorEfficiency: "≥ IE3",
    waterSupplyBar: 2.5,
    waterFlowLs: 0.8,
    waterPerEjectionL: 3.5,
    length: 2450,
    width: 1250,
    height: 1820,
    totalWeightKg: 3270,
    bowlWeightKg: 720,
    motorWeightKg: 550,
    bowlVolumeL: 50,
    ejectionSystem: "HydroStop",
    powerConsumptionTotalKW: 36
  },
  {
    application: "Wine",
    subApplication: "Clarific. of Sparkling Wine",
    feedSolidsMin: 0.3,
    feedSolidsMax: 0.5,
    capacityMinInp: 2000,
    capacityMaxInp: 2500,
    driveType: "flat-belt drive",
    level: "standard - Level",
    modelNumber: "GFA 10-43-210",
    bowlDiameter: 260,
    listPrice: 83397,
    motorPowerKW: 7.5,
    protectionClass: "IP55",
    motorEfficiency: "≥ IE3",
    waterSupplyBar: 2.5,
    waterFlowLs: 0.5,
    waterPerEjectionL: 0.6,
    length: 1070,
    width: 490,
    height: 830,
    totalWeightKg: 220,
    bowlWeightKg: 48,
    motorWeightKg: 66,
    bowlVolumeL: 2,
    ejectionSystem: "HydroStop",
    powerConsumptionTotalKW: 6
  },
  {
    application: "Beer",
    subApplication: "Clarification of Kwass",
    feedSolidsMin: 0.2,
    feedSolidsMax: 0.5,
    capacityMinInp: 16000,
    capacityMaxInp: 26000,
    driveType: "integrated direct drive",
    level: "premium - Level",
    modelNumber: "GFA 200-98-270",
    bowlDiameter: 810,
    listPrice: 307128,
    motorPowerKW: 55,
    protectionClass: "IP00",
    motorEfficiency: "-",
    waterSupplyBar: 2.5,
    waterFlowLs: 1,
    waterPerEjectionL: 7.5,
    length: 2000,
    width: 2070,
    height: 2080,
    totalWeightKg: 2900,
    bowlWeightKg: 1200,
    motorWeightKg: 0,
    bowlVolumeL: 63,
    ejectionSystem: "piston valve",
    powerConsumptionTotalKW: 44
  },
  {
    application: "Tea",
    subApplication: "Clarification of RTD Tea",
    feedSolidsMin: 0.2,
    feedSolidsMax: 0.5,
    capacityMinInp: 1000,
    capacityMaxInp: 1800,
    driveType: "flat-belt drive",
    level: "standard - Level",
    modelNumber: "GFA 10-50-645",
    bowlDiameter: 260,
    listPrice: 79612,
    motorPowerKW: 7.5,
    protectionClass: "IP55",
    motorEfficiency: "≥ IE3",
    waterSupplyBar: 2.5,
    waterFlowLs: 0.5,
    waterPerEjectionL: 0.6,
    length: 1070,
    width: 490,
    height: 830,
    totalWeightKg: 220,
    bowlWeightKg: 48,
    motorWeightKg: 66,
    bowlVolumeL: 2,
    ejectionSystem: "HydroStop",
    powerConsumptionTotalKW: 6
  },
  {
    application: "Fruit Juice",
    subApplication: "Fruit Juice",
    feedSolidsMin: 2,
    feedSolidsMax: 4,
    capacityMinInp: 20000,
    capacityMaxInp: 21000,
    driveType: "integrated direct drive",
    level: "premium - Level",
    modelNumber: "GFA 200-69-517",
    bowlDiameter: 810,
    listPrice: 338917,
    motorPowerKW: 55,
    protectionClass: "IP00",
    motorEfficiency: "-",
    waterSupplyBar: 2.5,
    waterFlowLs: 1.2,
    waterPerEjectionL: 11.0,
    length: 1480,
    width: 1730,
    height: 2070,
    totalWeightKg: 3100,
    bowlWeightKg: 1400,
    motorWeightKg: 0,
    bowlVolumeL: 69,
    ejectionSystem: "HydroStop",
    powerConsumptionTotalKW: 44
  }
];