import { TimeBlock } from "./time-block";
import { ChargeCode } from "./charge-code";

export interface TrackedTask {
  id: string;
  notes: string;
  chargeCodes: ChargeCode[];
  timeBlocks: TimeBlock[];
}
