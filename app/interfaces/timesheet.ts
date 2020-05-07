import { TimeCharged } from "./time-charged";

export interface Timesheet {
  id: string;
  weekEndingDate: number;
  timeCharged?: TimeCharged[];
}
