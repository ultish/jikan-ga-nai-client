import { tracked } from "@glimmer/tracking";
import { IUser } from "jikan-ga-nai/interfaces/user";

export default class User implements IUser {
  // if me was a native class with tracking, we could track individual attrs of the User
  @tracked id: string;
  @tracked username: string;
  @tracked role?: string;
  @tracked email: string;

  constructor(id: string, username: string, email: string, role?: string) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.role = role;
  }
}
