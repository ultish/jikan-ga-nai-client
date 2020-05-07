import Component from "@glimmer/component";
import { Timesheet } from "jikan-ga-nai/interfaces/timesheet";
import moment from "moment";

// @ts-ignore
import { toUp, toDown } from "ember-animated/transitions/move-over";

import { ChargeCode } from "jikan-ga-nai/interfaces/charge-code";
import { computed } from "@ember/object";

interface UiTrackedTimesheetArgs {
  timesheet: Timesheet;
}

class TimesheetRow {
  chargecode: ChargeCode | string;
  monday: number = 0;
  tuesday: number = 0;
  wednesday: number = 0;
  thursday: number = 0;
  friday: number = 0;
  saturday: number = 0;
  sunday: number = 0;
  total: number = 0;

  constructor(chargecode: ChargeCode | string) {
    this.chargecode = chargecode;
  }

  get isTotal() {
    return this.chargecode === "Total";
  }
}

export default class UiTrackedTimesheet extends Component<
  UiTrackedTimesheetArgs
> {
  constructor(owner: unknown, args: UiTrackedTimesheetArgs) {
    super(owner, args);
  }

  @computed("args.timesheet.timeCharged.@each.value")
  get calculatedTimesheet() {
    const map = new Map();

    this.args.timesheet?.timeCharged?.map((timeCharged) => {
      const day = moment(timeCharged.date).format("dddd").toLowerCase();

      // group by chargecodes, then by day

      let timesheetRow;
      if (map.has(timeCharged.chargeCode.id)) {
        timesheetRow = map.get(timeCharged.chargeCode.id);
      } else {
        timesheetRow = new TimesheetRow(timeCharged.chargeCode);
        map.set(timeCharged.chargeCode.id, timesheetRow);
      }

      timesheetRow[day] += timeCharged.value;
      timesheetRow["total"] += timeCharged.value;
    });

    // add a totals row
    let result = Array.from(map.values());
    let totals = this.dayTotals(result);
    debugger;
    result = [...result, totals];

    return result;
  }

  dayTotals(values: TimesheetRow[]) {
    const totals = new TimesheetRow("Total");
    // const dayMap: any = {};
    // dayMap["monday"] = 0;
    // dayMap["tuesday"] = 0;
    // dayMap["wednesday"] = 0;
    // dayMap["thursday"] = 0;
    // dayMap["friday"] = 0;
    // dayMap["saturday"] = 0;
    // dayMap["sunday"] = 0;

    values.forEach((timesheetRow: TimesheetRow) => {
      totals.monday += timesheetRow.monday;
      totals.tuesday += timesheetRow.tuesday;
      totals.wednesday += timesheetRow.wednesday;
      totals.thursday += timesheetRow.thursday;
      totals.friday += timesheetRow.friday;
      totals.saturday += timesheetRow.saturday;
      totals.sunday += timesheetRow.sunday;
      totals.total += timesheetRow.total;
    });

    return totals;
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
