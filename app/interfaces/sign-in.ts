import { IUser } from "./user";

export interface SignIn {
  signIn: {
    token: string;
    user: IUser;
  };
}
