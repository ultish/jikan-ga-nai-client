import Controller from "@ember/controller";
import { tracked } from "@glimmer/tracking";
import { inject as service } from "@ember/service";
import Authentication from "jikan-ga-nai/services/authentication";

export default class Application extends Controller {
  @service authentication!: Authentication;

  @tracked
  greetings = "";
  availableGreets = ["Hello", "Welcome", "こんにちは"];

  constructor() {
    super(...arguments);
  }

  onRouteActivate = () => {
    this.greetings = this.availableGreets[Math.floor(Math.random() * 3)];
  };
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module "@ember/controller" {
  interface Registry {
    application: Application;
  }
}
