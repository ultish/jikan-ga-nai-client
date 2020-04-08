import Route from "@ember/routing/route";
import { inject as service } from "@ember/service";

// importing this for the type reference
import Authentication from "jikan-ga-nai/services/authentication";
import { IUser } from "jikan-ga-nai/interfaces/user";

/**
 * This route checks you've logged in, otherwise re-routes you to the
 * login page
 */
export default class AuthRoute extends Route {
  @service authentication!: Authentication;

  // testMe?: IUser;

  async beforeModel(transition: any) {
    if (transition.targetName === "signup") {
      return;
    }

    const xToken = localStorage.getItem("x-token");
    if (xToken) {
      try {
        // try to login with the x-token
        await await this.authentication.loginWithToken();
      } catch (e) {
        console.warn("Invalid login, redirecting...");
        this.transitionTo("login");
      }
    } else {
      // redirect to login page
      this.transitionTo("login");
    }
  }
}
