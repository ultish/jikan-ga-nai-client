import Component from "@glimmer/component";
import { TrackedDay } from "jikan-ga-nai/interfaces/tracked-day";
import moment from "moment";
import { action } from "@ember/object";
import { ScaleTime } from "d3-scale";

interface UiTrackedTaskArgs {
  day: TrackedDay;
  scale: ScaleTime<Number, Number>;
  ticks: Date[];
}
export default class UiTrackedDay extends Component<UiTrackedTaskArgs> {
  constructor(owner: unknown, args: UiTrackedTaskArgs) {
    super(owner, args);
  }

  @action
  didResize() {
    console.log("resized!");
  }

  get squares() {
    let result = [];
    for (let i = 0; i < 48; i++) {
      result.push({});
    }
    return result;
  }
}
