import Controller from "@ember/controller";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";

import ApolloService from "ember-apollo-client/services/apollo";
import { queryManager } from "ember-apollo-client";
import { htmlSafe } from "@ember/string";
import { inject as service } from "@ember/service";
import Authentication from "jikan-ga-nai/services/authentication";

export default class Login extends Controller {
  @queryManager({ service: "apollo" }) apollo!: ApolloService;
  @service authentication!: Authentication;

  @tracked
  username = "";
  @tracked
  password = "";
  @tracked
  errors = [];

  numBgImages = 10;
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
    this.errors = [];
  };

  @action
  async login(e: Event) {
    e.preventDefault();
    try {
      await this.authentication.login(this.username, this.password);

      this.transitionToRoute("home");
    } catch (e) {
      this.errors = e.errors;
    }
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module "@ember/controller" {
  interface Registry {
    login: Login;
  }
}
