import Component from "@glimmer/component";
import { TrackedDay } from "jikan-ga-nai/interfaces/tracked-day";
import moment from "moment";
import { action } from "@ember/object";
import RouterService from "@ember/routing/router-service";
import { inject as service } from "@ember/service";
import { alias } from "@ember/object/computed";
import mutationDeleteTrackedDay from "jikan-ga-nai/gql/mutations/deleteTrackedDay.graphql";
import { queryManager } from "ember-apollo-client";
import ApolloService from "ember-apollo-client/services/apollo";

interface UiTrackedDayArgs {
  day: TrackedDay;
}
export default class UiTrackedDay extends Component<UiTrackedDayArgs> {
  @service
  router!: RouterService;
  @queryManager() apollo!: ApolloService;

  constructor(owner: unknown, args: UiTrackedDayArgs) {
    super(owner, args);
  }

  @action
  click() {
    console.log("click");
    this.router.transitionTo("tracker.day", this.args.day.id);
  }

  @action
  async deleteTrackedDay(e: MouseEvent) {
    e.stopPropagation();

    this.router.transitionTo("tracker");

    this.apollo.mutate({
      mutation: mutationDeleteTrackedDay,
      variables: {
        id: this.args.day.id,
      },

      updateQueries: {
        trackedDays: (prev, { mutationResult }) => {
          debugger;
          const deletedId = mutationResult?.data?.deleteTrackedDay;
          if (deletedId) {
            const toRemove = prev.trackedDays.edges.find(
              (td: TrackedDay) => td.id === deletedId
            );
            if (toRemove) {
              prev.trackedDays.edges.removeObject(toRemove);
            }
          }
          return prev;
        },
      },
    });
  }

  @action
  deleteClick(e: MouseEvent) {
    e.stopPropagation();
  }

  get weekOfYearDisplay() {
    const weekOfYear = moment(this.args.day.date).isoWeek();
    return weekOfYear % 2 === 0;
  }

  get classes() {
    let result = [];
    if (this.weekOfYearDisplay) {
      result.push("even-week");
    } else {
      result.push("odd-week");
    }

    if (this.active) {
      result.push("active");
    }

    return result.join(" ");
  }

  @alias("router.currentURL")
  currentURL!: string;

  get active() {
    // track it
    this.currentURL;
    return this.router.isActive("tracker.day", this.args.day);
  }

  *transition() {
    console.log("tracked-day", arguments);
  }
}
