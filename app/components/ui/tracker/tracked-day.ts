import Component from "@glimmer/component";
import { TrackedDay } from "jikan-ga-nai/interfaces/tracked-day";
import moment from "moment";
import { action } from "@ember/object";
import RouterService from "@ember/routing/router-service";
import { inject as service } from "@ember/service";
import { alias } from "@ember/object/computed";

interface UiTrackedDayArgs {
  day: TrackedDay;
}
export default class UiTrackedDay extends Component<UiTrackedDayArgs> {
  @service
  router!: RouterService;

  constructor(owner: unknown, args: UiTrackedDayArgs) {
    super(owner, args);
  }

  @action
  click() {
    this.router.transitionTo("tracker.day", this.args.day.id);
  }

  @action
  deleteTrackedDay(e: MouseEvent) {
    e.stopPropagation();
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
