import IUser from "../models/user";

export interface Message {
  id: string;
  text: string;
  user: IUser;
}
