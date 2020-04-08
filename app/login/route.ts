import Route from "@ember/routing/route";
import LoginController from "./controller";

export default class Login extends Route.extend({
  // anything which *must* be merged to prototype here
}) {
  // normal class body definition here

  setupController(controller: LoginController, model: any) {
    super.setupController(controller, model);

    controller.onRouteActivate();
  }
}
