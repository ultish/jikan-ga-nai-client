import Route from "@ember/routing/route";
import SignupController from "./controller";

export default class Signup extends Route.extend({
  // anything which *must* be merged to prototype here
}) {
  // normal class body definition here

  setupController(controller: SignupController, model: any) {
    super.setupController(controller, model);

    controller.onRouteActivate();
  }
}
