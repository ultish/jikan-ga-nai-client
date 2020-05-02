import { ChargeCode } from "./charge-code";

export interface TrackedTask {
  id: string;
  notes: string;
  chargeCodes: ChargeCode[];
  createdAt: number;
}
