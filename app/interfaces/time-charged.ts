import { ChargeCode } from "./charge-code";

export interface TimeCharged {
  id: string;
  date: number;
  value: number;
  chargeCode: ChargeCode;
}
