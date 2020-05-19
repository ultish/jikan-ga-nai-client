import AuthRoute from "jikan-ga-nai/framework/auth-route";
import ApplicationController from "./controller";

export default class Application extends AuthRoute {
  setupController(controller: ApplicationController) {
    controller.onRouteActivate();
  }
}
