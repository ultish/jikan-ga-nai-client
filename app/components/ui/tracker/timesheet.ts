import Component from "@glimmer/component";
import { Timesheet } from "jikan-ga-nai/interfaces/timesheet";
import moment from "moment";

// @ts-ignore
import { toUp, toDown } from "ember-animated/transitions/move-over";

interface UiTrackedTimesheetArgs {
  timesheet: Timesheet;
}

interface TimesheetRow {
  chargecode: String;
  monday: Number;
  tuesday: Number;
  wednesday: Number;
  thursday: Number;
  friday: Number;
  saturday: Number;
  sunday: Number;
}

export default class UiTrackedTimesheet extends Component<
  UiTrackedTimesheetArgs
> {
  constructor(owner: unknown, args: UiTrackedTimesheetArgs) {
    super(owner, args);
  }

  get calculatedTimesheet() {
    const chargeCodeMap = {};

    this.args.timesheet?.timeCharged?.map((timeCharged) => {
      const day = moment(timeCharged.date).format("dddd").toLowerCase();
      timeCharged.chargeCode.id;
      // chargeCodeMap[timeCharged.chargeCode.id] = {};
    });

    const result: TimesheetRow[] = [];
    result.pushObject({
      chargecode: "AAA",
      monday: 8,
      tuesday: 2,
      wednesday: 0,
      thursday: 0,
      friday: 10,
      saturday: 0,
      sunday: 0,
    });
    return result;
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
