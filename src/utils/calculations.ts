import type { Habitation, RelocationSite } from '../types';

export const calculateCapacityDeficit = (
  habitations: Habitation[],
  sites: RelocationSite[]
): number => {
  const totalPopulation = habitations.reduce((sum, hab) => sum + hab.population, 0);
  const totalCapacity = sites.reduce((sum, site) => sum + site.resourceCapacity.effectiveCapacity, 0);
  return Math.max(0, totalPopulation - totalCapacity);
};

export const filterCriticalHabitations = (habitations: Habitation[]): Habitation[] => {
  return habitations.filter(hab => hab.riskScore > 0.8);
};

export const calculateSiteUtilization = (site: RelocationSite, allocatedPopulation: number): number => {
  const effCap = site.resourceCapacity.effectiveCapacity;
  if (effCap === 0) return 100;
  return (allocatedPopulation / effCap) * 100;
};
