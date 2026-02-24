/**
 * Matches Swift Capability: Identifiable, Hashable, Codable
 */
export interface Capability {
  id: string;
  name: string;
}

/**
 * Matches Swift CareCenter: Identifiable, Hashable, Codable
 */
export interface CareCenter {
  id: string;
  name: string;
  streetAddress: string;
  city: string;
  region: string;
  country: string;
  capabilities: Capability[];
  latitude: number;
  longitude: number;
  type?: string;
  dailyHours?: string;
  phoneNumber?: string;
  email?: string;
}

export function createCapability(name = ""): Capability {
  return {
    id: crypto.randomUUID(),
    name,
  };
}

export function createEmptyCareCenter(): CareCenter {
  return {
    id: crypto.randomUUID(),
    name: "",
    streetAddress: "",
    city: "",
    region: "",
    country: "",
    capabilities: [],
    latitude: 0,
    longitude: 0,
    type: "",
    dailyHours: "",
    phoneNumber: "",
    email: "",
  };
}
