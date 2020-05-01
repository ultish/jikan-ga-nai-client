import Route from "@ember/routing/route";
import TrackerDayController from "./controller";

import { queryManager, getObservable, unsubscribe } from "ember-apollo-client";
import ApolloService from "ember-apollo-client/services/apollo";
import { ObservableQuery } from "apollo-client/core/ObservableQuery";

import queryGetTrackedTasks from "jikan-ga-nai/gql/queries/trackedTasks.graphql";
import queryGetTrackedDay from "jikan-ga-nai/gql/queries/trackedDay.graphql";
import { GetTrackedTasks } from "jikan-ga-nai/interfaces/get-tracked-tasks";

import { hash } from "rsvp";
import { TrackedTask } from "jikan-ga-nai/interfaces/tracked-task";
import { TrackedDay } from "jikan-ga-nai/interfaces/tracked-day";

interface Model {
  trackedDay: TrackedDay;
  trackedTasks: TrackedTask[];
}

export default class TrackerDay extends Route {
  @queryManager() apollo!: ApolloService;

  async setupController(
    controller: TrackerDayController,
    model: Model
  ): Promise<void> {
    super.setupController(controller, model);

    console.log("setup cont");
    // notify controller for any setup on activate
    controller.onRouteActivate();
  }

  model({ id }: { id: String }) {
    return hash({
      trackedDay: this.apollo.query(
        {
          query: queryGetTrackedDay,
          variables: {
            trackedDayId: id,
          },
        },
        "trackedDay"
      ),
      trackedTasks: this.apollo.watchQuery(
        {
          query: queryGetTrackedTasks,
          variables: {
            trackedDayId: id,
          },
        },
        "trackedTasks"
      ),
    });
  }
}
