import { TimeCharged } from "./time-charged";

export interface Timesheet {
  id: String;
  weekEndingDate: number;
  timeCharged?: TimeCharged[];
}
