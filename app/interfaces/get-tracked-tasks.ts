import { TrackedTask } from "./tracked-task";

export interface GetTrackedTasks {
  edges: [TrackedTask];
  pageInfo: {
    endCursor: string;
    hasNextPage: boolean;
    __typename: string;
  };
  __typename: string;
}
