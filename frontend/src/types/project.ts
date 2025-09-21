export interface Machine {
  id: string;
  projectId: string;
  name: string;
  listPrice: number;
  totalOperationCosts: number;
  totalMaintenanceCosts: number;
  tco: number;
}

export interface Project {
  id: string;
  projectName: string;
  company: string;
  contact: string;
  telephone: string;
  mail: string;
  application: string;
  subApplication: string;
  feedSolid: number;
  capacityPerDay: number;
  // Calculation details
  years: number;
  workdaysPerWeek: number;
  energyPriceEurPerKwh: number;
  waterPriceEurPerL: number;
  protectionClass: string;
  motorEfficiency: string;
  maxWidth: number;
  maxLength: number;
  maxHeight: number;
  maxWeight: number;
  tcoTotal: number;
  createdAt: Date;
  updatedAt: Date;
  machines: Machine[];
}