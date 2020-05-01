import Route from "@ember/routing/route";
import TrackerDayController from "./controller";

import { queryManager, getObservable, unsubscribe } from "ember-apollo-client";
import ApolloService from "ember-apollo-client/services/apollo";
import { ObservableQuery } from "apollo-client/core/ObservableQuery";

import queryGetTrackedTasks from "jikan-ga-nai/gql/queries/trackedTasks.graphql";
import { GetTrackedTasks } from "jikan-ga-nai/interfaces/get-tracked-tasks";

export default class TrackerDay extends Route {
  @queryManager() apollo!: ApolloService;

  async setupController(
    controller: TrackerDayController,
    model: any
  ): Promise<void> {
    super.setupController(controller, model);

    // notify controller for any setup on activate
    controller.onRouteActivate();
  }

  model({ id }: { id: String }) {
    return this.apollo.watchQuery(
      {
        query: queryGetTrackedTasks,
        variables: {
          trackedDayId: id,
        },
      },
      "trackedTasks"
    );
  }
}
