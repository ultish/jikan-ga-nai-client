import Controller from "@ember/controller";
import { queryManager, getObservable } from "ember-apollo-client";

import ApolloService from "ember-apollo-client/services/apollo";
import { sort } from "@ember/object/computed";
import { action } from "@ember/object";

import { scaleTime, ScaleTime } from "d3-scale";
import jQuery from "jquery";
import { tracked } from "@glimmer/tracking";
import moment from "moment";

import { A } from "@ember/array";

// @ts-ignore
import { toUp, toDown } from "ember-animated/transitions/move-over";
import { TrackedTask } from "jikan-ga-nai/interfaces/tracked-task";

import subTimesheetUpdated from "jikan-ga-nai/gql/subscriptions/timesheet-updated.graphql";
import mutationCreateTrackedTask from "jikan-ga-nai/gql/mutations/createTrackedTask.graphql";
import queryGetTrackedTasks from "jikan-ga-nai/gql/queries/trackedTasks.graphql";

const TRACKED_TASKS_WIDTH = 300;

export default class TrackerDay extends Controller {
  @queryManager() apollo!: ApolloService;

  @tracked containerWidth = 0;
  @tracked startTime = moment().startOf("day");
  @tracked stopTime = moment().startOf("day");
  @tracked scale?: ScaleTime<Number, Number>;
  @tracked ticks = A<Date>();
  tickFormat?: Function;
  timesheetUpdatedSub: any;

  onRouteActivate = () => {
    const baseDate = this.model.trackedDay.date;

    // baseDate is stored as UTC in the DB, but was initially local-time, converted into UTC for storage

    this.startTime = moment(baseDate).add(6, "hours");
    this.stopTime = this.startTime.clone().add(8, "hours");

    this.calculateScale();

    const observerable = getObservable(this.model.timesheet);

    if (observerable) {
      observerable.subscribeToMore({
        document: subTimesheetUpdated,
        // updateQuery: (prev, { subscriptionData }) => {
        //   debugger;
        //   return prev;
        // },
      });
    }
  };

  onLeaving = () => {
    // if (this.timesheetUpdatedSub) {
    //   this.timesheetUpdatedSub.apolloUnsubscribe();
    // }
  };

  @action
  addTrackedTask() {
    // add here
    const trackedDayId = this.model.trackedDay.id;
    debugger;
    this.apollo.mutate({
      mutation: mutationCreateTrackedTask,
      variables: {
        trackedDayId: trackedDayId,
      },
      updateQueries: {
        trackedTasks: (prev, { mutationResult, queryVariables }) => {
          debugger;
          if (queryVariables.trackedDayId === this.model.trackedDay.id) {
            if (mutationResult?.data?.createTrackedTask) {
              // prev.timeBlocks.pushObject(mutationResult.data.createTimeBlock);
              prev.trackedTasks.edges.pushObject(
                mutationResult.data.createTrackedTask
              );
            }
          }
          return prev;
        },
      },
    });
  }

  @action
  didResize() {
    const container = jQuery("#tracked-tasks-container");
    this.containerWidth = container.width() ?? 0;

    this.calculateScale();
  }

  calculateScale() {
    const scale = scaleTime();

    const TIMEBLOCK_WIDTH = 60;

    const availableWidth = this.containerWidth - TRACKED_TASKS_WIDTH;
    const numBlocks = Math.floor(availableWidth / TIMEBLOCK_WIDTH) - 1;
    const usedWidth = numBlocks * TIMEBLOCK_WIDTH;

    this.stopTime = this.startTime
      .clone()
      .add(numBlocks * TIMEBLOCK_WIDTH, "minutes");

    scale
      .domain([this.startTime.toDate(), this.stopTime.toDate()])
      .range([0, usedWidth]);

    const ticks = scale.ticks(numBlocks);

    this.scale = scale;
    // this.ticks = ticks;
    this.ticks.clear();
    this.ticks.pushObjects(ticks);
    this.tickFormat = scale.tickFormat();

    // console.log(scale);

    return this.scale;
  }

  get formattedTicks() {
    return this.ticks?.map((date) =>
      this.tickFormat ? this.tickFormat(date) : date
    );
  }

  @sort("model.trackedTasks.edges", (a, b) => {
    if (a.createdAt > b.createdAt) {
      return 1;
    } else if (a.createdAt < b.createdAt) {
      return -1;
    } else {
      return 0;
    }
  })
  sortedTasks!: [TrackedTask];

  @tracked
  counter = 0;

  @action
  increment() {
    this.counter = parseFloat((this.counter + 0.1).toFixed(3));
  }

  @action
  decrement() {
    this.counter = parseFloat((this.counter - 0.1).toFixed(3));
  }

  // @ts-ignore
  rules({ oldItems, newItems }) {
    if (oldItems[0] > newItems[0]) {
      return toDown;
    } else {
      return toUp;
    }
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module "@ember/controller" {
  interface Registry {
    "tracker/day": TrackerDay;
  }
}
