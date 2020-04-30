import Component from "@glimmer/component";
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

interface PagesTrackerArgs {
  dayId: number;
  day: any;
}

const TRACKED_TASKS_WIDTH = 300;

export default class PagesTracker extends Component<PagesTrackerArgs> {
  @queryManager() apollo!: ApolloService;

  @tracked containerWidth = 0;
  @tracked startTime: Moment;
  @tracked stopTime: Moment;
  @tracked scale?: ScaleTime<Number, Number>;
  @tracked ticks?: Date[];
  tickFormat?: Function;

  constructor(owner: unknown, args: PagesTrackerArgs) {
    super(owner, args);
    this.startTime = moment().startOf("day").add(6, "hours");
    this.stopTime = this.startTime.clone().add(8, "hours");
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
    this.ticks = ticks;
    this.tickFormat = scale.tickFormat();

    // console.log(scale);
  }

  get formattedTicks() {
    return this.ticks?.map((date) =>
      this.tickFormat ? this.tickFormat(date) : date
    );
  }
}
