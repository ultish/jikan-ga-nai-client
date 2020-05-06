import Component from "@glimmer/component";
import { Timesheet } from "jikan-ga-nai/interfaces/timesheet";

// @ts-ignore
import { toUp, toDown } from "ember-animated/transitions/move-over";

interface UiTrackedTimesheetArgs {
  timesheet: Timesheet;
}

export default class UiTrackedTimesheet extends Component<
  UiTrackedTimesheetArgs
> {
  constructor(owner: unknown, args: UiTrackedTimesheetArgs) {
    super(owner, args);
  }

  // @ts-ignore
  rules(ref) {
    const { oldItems, newItems } = ref;

    // const a = oldItems[0]?.value;
    // const b = newItems[0]?.value;
    const a = oldItems[0] ?? 0;
    const b = newItems[0] ?? 0;

    if (a > b) {
      return toDown;
    } else {
      return toUp;
    }
  }
}
