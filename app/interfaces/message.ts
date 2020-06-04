import IUser from "../models/user";

export interface Message {
  id: string;
  text: string;
  createdAt: Date;
  user: IUser;
  seen?: boolean;
  lastViewed?: boolean;
}
