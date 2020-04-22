import { TrackedDay } from "./tracked-day";

export interface GetTrackedDays {
  edges: [TrackedDay];
  pageInfo: {
    endCursor: string;
    hasNextPage: boolean;
  };
}
