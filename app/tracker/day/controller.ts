import Controller from "@ember/controller";
import { queryManager, getObservable, unsubscribe } from "ember-apollo-client";

import ApolloService from "ember-apollo-client/services/apollo";
import { ObservableQuery } from "apollo-client/core/ObservableQuery";

import { task } from "ember-concurrency-decorators";
import { sort } from "@ember/object/computed";
import { computed, action, get } from "@ember/object";

import { scaleTime, ScaleTime } from "d3-scale";
import jQuery from "jquery";
import { tracked } from "@glimmer/tracking";
import moment, { Moment } from "moment";

import { toUp, toDown } from "ember-animated/transitions/move-over";

const TRACKED_TASKS_WIDTH = 300;

export default class TrackerDay extends Controller {
  @queryManager() apollo!: ApolloService;

  @tracked containerWidth = 0;
  @tracked startTime = moment().startOf("day");
  @tracked stopTime = moment().startOf("day");
  @tracked scale?: ScaleTime<Number, Number>;
  @tracked ticks?: Date[];
  tickFormat?: Function;

  onRouteActivate = () => {
    this.startTime = moment().startOf("day").add(6, "hours");
    this.stopTime = this.startTime.clone().add(8, "hours");
    console.log("tracker day", this.model);
  };

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
    this.ticks = ticks;
    this.tickFormat = scale.tickFormat();

    // console.log(scale);
  }

  get formattedTicks() {
    return this.ticks?.map((date) =>
      this.tickFormat ? this.tickFormat(date) : date
    );
  }

  @tracked
  counter = 1;

  @action
  increment() {
    this.counter++;
  }

  @action
  decrement() {
    this.counter--;
  }

  rules({ oldItems, newItems }) {
    if (oldItems[0] < newItems[0]) {
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
