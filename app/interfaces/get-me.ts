export interface GetMe {
  me: {
    id: string;
    username: string;
    role?: string;
    email: string;
  };
}
