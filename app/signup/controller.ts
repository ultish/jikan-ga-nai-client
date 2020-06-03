import Controller from "@ember/controller";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";

import CustomApolloService from "jikan-ga-nai/services/custom-apollo";
import { queryManager } from "ember-apollo-client";
import signUp from "jikan-ga-nai/gql/mutations/signUp.graphql";
import { SignUp } from "jikan-ga-nai/interfaces/sign-up";
import { htmlSafe } from "@ember/string";
import Authentication from "jikan-ga-nai/services/authentication";
import { inject as service } from "@ember/service";

export default class Signup extends Controller {
  @queryManager({ service: "custom-apollo" }) apollo!: CustomApolloService;
  @service authentication!: Authentication;

  @tracked
  username = "";
  @tracked
  password = "";
  @tracked
  email = "";
  @tracked
  errors = [];

  numBgImages = 11;
  @tracked
  backgroundImage = "images/spacex-1.jpg";
  @tracked
  background = htmlSafe(`background-image: url('${this.backgroundImage}');`);

  constructor() {
    super(...arguments);
  }

  onRouteActivate = () => {
    this.backgroundImage = `images/spacex-${Math.ceil(
      Math.random() * this.numBgImages
    )}.jpg`;

    this.username = "";
    this.password = "";
    this.email = "";
    this.errors = [];
  };

  @action
  async signup(e: Event) {
    e.preventDefault();

    try {
      const success: SignUp = await this.apollo.mutate({
        mutation: signUp,
        variables: {
          username: this.username,
          password: this.password,
          email: this.email,
        },
      });

      if (success) {
        localStorage.setItem("x-token", success.signUp.token);
        await this.authentication.loginWithToken(true);
        await this.transitionToRoute("home");
      }
    } catch (e) {
      console.warn(e);
      this.errors = this.parseErrors(e);
    }
  }

  parseErrors(e: any) {
    return e.errors.map((error: any) => {
      const name = error.message;
      let details = [];
      if (error.extensions) {
        details = error?.extensions?.exception?.errors;
        if (details) {
          details = details.map((d: any) => d.message);
        }
      }
      return {
        name: name,
        details: details,
      };
    });
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module "@ember/controller" {
  interface Registry {
    signup: Signup;
  }
}
