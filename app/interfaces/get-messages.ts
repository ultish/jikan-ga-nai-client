import { Message } from "./message";
export interface GetMessages {
  edges: [Message];
  pageInfo: {
    endCursor: string;
    hasNextPage: boolean;
  };
}
