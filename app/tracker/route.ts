import AuthRoute from "jikan-ga-nai/framework/auth-route";
import TrackerController from "./controller";

export default class Tracker extends AuthRoute {
  async setupController(controller: TrackerController): Promise<void> {
    super.setupController(controller, {});

    // notify controller for any setup on activate
    controller.onRouteActivate();
  }
}
