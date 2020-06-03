import Controller from "@ember/controller";
import { queryManager, getObservable } from "ember-apollo-client";

import CustomApolloService from "jikan-ga-nai/services/custom-apollo";
import { sort } from "@ember/object/computed";
import { action, set } from "@ember/object";

import { scaleTime, ScaleTime } from "d3-scale";
import jQuery from "jquery";
import { tracked } from "@glimmer/tracking";
import moment from "moment";

import { A } from "@ember/array";

import { TrackedTask } from "jikan-ga-nai/interfaces/tracked-task";

import { DayMode } from "jikan-ga-nai/interfaces/day-mode";
import subTimesheetUpdated from "jikan-ga-nai/gql/subscriptions/timesheet-updated.graphql";
import mutationCreateTrackedTask from "jikan-ga-nai/gql/mutations/createTrackedTask.graphql";
import mutationUpdateTrackedDay from "jikan-ga-nai/gql/mutations/updateTrackedDay.graphql";

// @ts-ignore
import { toUp, toDown } from "ember-animated/transitions/move-over";

const TRACKED_TASKS_WIDTH = 300;
const TIMEBLOCK_WIDTH = 60;

export default class TrackerDay extends Controller {
  @queryManager({ service: "custom-apollo" }) apollo!: CustomApolloService;

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

    // TODO Make this ENV controlled
    this.startTime = moment(baseDate).add(0, "hours");
    this.stopTime = this.startTime.clone().add(8, "hours");

    this.calculateScale();

    const observerable = getObservable(this.model.timesheet);

    if (observerable) {
      observerable.subscribeToMore({
        document: subTimesheetUpdated,
        // updateQuery: (prev, { subscriptionData }) => {
        //   set(
        //     prev,
        //     "timesheet.timeCharged",
        //     subscriptionData.data.timesheetUpdated.timeCharged
        //   );
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

  get modes() {
    return [
      DayMode.NORMAL,
      DayMode.HOL_ANNUAL,
      DayMode.HOL_PERSONAL,
      DayMode.HOL_PUBLIC,
      DayMode.HOL_RDO,
    ];
  }

  @action
  modeChange(mode: DayMode) {
    this.apollo.mutate({
      mutation: mutationUpdateTrackedDay,
      variables: {
        id: this.model.trackedDay.id,
        mode: mode,
      },
      updateQueries: {
        trackedDay: (prev, { mutationResult, queryVariables }) => {
          if (prev.trackedDay.id === queryVariables.trackedDayId) {
            set(
              prev.trackedDay,
              "mode",
              mutationResult?.data?.updateTrackedDay.mode
            );
          }
          return prev;
        },
      },
    });
  }
  @action
  addTrackedTask() {
    // add here
    const trackedDayId = this.model.trackedDay.id;
    this.apollo.mutate({
      mutation: mutationCreateTrackedTask,
      variables: {
        trackedDayId: trackedDayId,
      },
      updateQueries: {
        trackedTasks: (prev, { mutationResult, queryVariables }) => {
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

  prevX = 0;

  @action
  dragStart(e: DragEvent) {
    this.prevX = e.clientX;
  }

  @action
  dragEnd(e: DragEvent) {
    e.preventDefault();
    this.hideDragError(e);
  }
  @action
  drag(e: DragEvent) {
    e.preventDefault();

    const gapX = this.prevX - e.clientX;

    if (e.clientX === 0) {
      this.prevX = e.clientX;
      return;
    }
    const blocks = Math.floor(gapX / TIMEBLOCK_WIDTH);
    if (blocks !== 0) {
      const hoursMoved = Math.floor(gapX / TIMEBLOCK_WIDTH);

      const earliest = this.startTime.clone().startOf("day");
      const latest = earliest.clone().add(24, "hours");

      const availableWidth = this.containerWidth - TRACKED_TASKS_WIDTH;
      const numBlocks = Math.floor(availableWidth / TIMEBLOCK_WIDTH) - 1;

      const proposedDate = this.startTime.clone().add(hoursMoved, "hours");

      const proposedStopDate = proposedDate
        .clone()
        .add(numBlocks * TIMEBLOCK_WIDTH, "minutes");

      if (
        earliest.isSameOrBefore(proposedDate) &&
        latest.isAfter(proposedStopDate)
      ) {
        this.hideDragError(e);

        this.startTime = proposedDate;
        this.prevX -= blocks * TIMEBLOCK_WIDTH;
        this.calculateScale();
      } else {
        this.showDragError(e);
      }
    }
  }

  showDragError(e: DragEvent) {
    if (e.target instanceof Element) {
      e.target.classList.add("error");
    }
  }
  hideDragError(e: DragEvent) {
    if (e.target instanceof Element) {
      e.target.classList.remove("error");
    }
  }

  calculateScale() {
    const scale = scaleTime();

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
    this.ticks.clear();
    this.ticks.pushObjects(ticks);
    this.tickFormat = scale.tickFormat();

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
