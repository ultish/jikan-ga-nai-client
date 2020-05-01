import Route from "@ember/routing/route";

import TrackerController from "./controller";
export default class Tracker extends Route {
  async setupController(controller: TrackerController): Promise<void> {
    super.setupController(controller, {});

    // notify controller for any setup on activate
    controller.onRouteActivate();
  }
}
