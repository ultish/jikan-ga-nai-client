import Component from "@glimmer/component";
import { TrackedDay } from "jikan-ga-nai/interfaces/tracked-day";
import moment from "moment";
import { action } from "@ember/object";
import RouterService from "@ember/routing/router-service";
import { inject as service } from "@ember/service";

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
    console.log("hello", arguments);
    this.router.transitionTo("tracker.day", this.args.day);
  }

  get weekOfYearDisplay() {
    const weekOfYear = Number.parseInt(moment(this.args.day.date).format("w"));
    return weekOfYear % 2 === 0;
  }

  get classes() {
    let result = [];
    if (this.weekOfYearDisplay) {
      result.push("even-week");
    } else {
      result.push("odd-week");
    }

    return result;
  }
}
