// src/data/navData.ts — Shared navigation data for the AZ-900 study guide

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export interface NavSection {
  title: string;
  href: string;
}

export interface NavGroup {
  domain: string;
  weight: string;
  sections: NavSection[];
}

export const navData: NavGroup[] = [
  {
    domain: 'Domain 1: Describe Cloud Concepts',
    weight: '25-30%',
    sections: [
      { title: '1.1 Define cloud computing', href: `${base}/sections/1-1-define-cloud-computing/` },
      { title: '1.2 Shared responsibility model', href: `${base}/sections/1-2-shared-responsibility-model/` },
      { title: '1.3 Cloud models', href: `${base}/sections/1-3-cloud-models/` },
      { title: '1.4 Consumption-based model', href: `${base}/sections/1-4-consumption-based-model/` },
      { title: '1.5 Cloud service types', href: `${base}/sections/1-5-cloud-service-types/` },
      { title: '1.6 Benefits of cloud', href: `${base}/sections/1-6-benefits-of-cloud/` },
    ],
  },
  {
    domain: 'Domain 2: Azure Architecture & Services',
    weight: '35-40%',
    sections: [
      { title: '2.1 Core architectural components', href: `${base}/sections/2-1-core-architectural-components/` },
      { title: '2.2a Compute services', href: `${base}/sections/2-2a-compute-services/` },
      { title: '2.2b Networking services', href: `${base}/sections/2-2b-networking-services/` },
      { title: '2.3 Storage services', href: `${base}/sections/2-3-storage-services/` },
      { title: '2.4 Identity, access & security', href: `${base}/sections/2-4-identity-access-security/` },
    ],
  },
  {
    domain: 'Domain 3: Management & Governance',
    weight: '30-35%',
    sections: [
      { title: '3.1 Cost management', href: `${base}/sections/3-1-cost-management/` },
      { title: '3.2 Governance & compliance', href: `${base}/sections/3-2-governance-compliance/` },
      { title: '3.3 Resource management tools', href: `${base}/sections/3-3-resource-management-tools/` },
      { title: '3.4 Monitoring tools', href: `${base}/sections/3-4-monitoring-tools/` },
    ],
  },
];

// Flat list of all sections in order — used by PrevNextNav for sequential navigation
export const allSections: NavSection[] = navData.flatMap((group) => group.sections);
