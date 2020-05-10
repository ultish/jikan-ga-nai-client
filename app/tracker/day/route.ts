import Route from "@ember/routing/route";
import TrackerDayController from "./controller";

import { queryManager } from "ember-apollo-client";
import ApolloService from "ember-apollo-client/services/apollo";

import queryGetTrackedTasks from "jikan-ga-nai/gql/queries/trackedTasks.graphql";
import queryGetTrackedDay from "jikan-ga-nai/gql/queries/trackedDay.graphql";
import queryGetChargeCodes from "jikan-ga-nai/gql/queries/chargeCodes.graphql";
import queryTimesheet from "jikan-ga-nai/gql/queries/timesheet.graphql";

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

    // notify controller for any setup on activate
    controller.onRouteActivate();
  }

  async model({ id }: { id: string }) {
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
      // TODO move this out into the timesheet component
      timesheet: this.apollo.watchQuery(
        {
          query: queryTimesheet,
          variables: {
            trackedDayId: id,
          },
        },
        "timesheet"
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
      chargeCodes: this.apollo.watchQuery(
        {
          query: queryGetChargeCodes,
          // TODO add subscription here
        },
        "chargeCodes"
      ),
    });
  }
}
