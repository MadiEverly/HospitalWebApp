/**
 * Matches Swift Capability: Identifiable, Hashable, Codable
 */
export interface Capability {
  id: string;
  name: string;
}

/** Predefined capability options shown as checkboxes in the form. */
export const PREDEFINED_CAPABILITIES = [
  "X-ray",
  "Ultrasound",
  "Emergency Room",
  "Urgent Care",
  "Stitches",
  "Pediatric Care",
  "Trauma Center",
  "Maternity",
  "Poison treatment",
  "Burn treatment",
  "CT scan",
] as const;

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
  /**
   * Typical wait time in **minutes**. Firestore field name: `waitTime`.
   */
  waitTime?: number;
  /**
   * Current facility issue type / description (e.g. "X-ray broken").
   * Firestore field name: `facilityIssueType`.
   */
  facilityIssueType?: string;
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
