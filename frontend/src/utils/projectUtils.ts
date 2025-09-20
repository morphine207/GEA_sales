import { Project, Machine } from '@/types/project';

export function createNewProject(): Project {
  const id = Date.now().toString();
  
  return {
    id,
    projectName: `PROJECT ${id.slice(-3)}`,
    company: '',
    contact: '',
    telephone: '',
    mail: '',
    application: '',
    subApplication: '',
    feedSolid: '',
    capacityPerDay: 0,
    protectionClass: '',
    motorEfficiency: '',
    maxWidth: 0,
    maxLength: 0,
    maxHeight: 0,
    maxWeight: 0,
    tcoTotal: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    machines: []
  };
}