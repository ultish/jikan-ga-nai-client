import { TimeCharged } from "./time-charged";
import { TrackedDay } from "jikan-ga-nai/interfaces/tracked-day";

export interface Timesheet {
  id: string;
  weekEndingDate: number;
  timeCharged?: TimeCharged[];
  trackedDays: TrackedDay[];
}
