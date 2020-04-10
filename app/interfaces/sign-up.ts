import { IUser } from "./user";

export interface SignUp {
  signUp: {
    token: string;
    user: IUser;
  };
}
