import Component from "@glimmer/component";
import { Timesheet } from "jikan-ga-nai/interfaces/timesheet";
import moment from "moment";

// @ts-ignore
import { toUp, toDown } from "ember-animated/transitions/move-over";

import { ChargeCode } from "jikan-ga-nai/interfaces/charge-code";
import { computed } from "@ember/object";
import { DayMode } from "jikan-ga-nai/interfaces/day-mode";
import { TrackedDay } from "jikan-ga-nai/interfaces/tracked-day";

// TODO move this to DB
const HOURS_IN_DAY = 7.6 * 60;

interface UiTrackedTimesheetArgs {
  timesheet: Timesheet;
  chargeCodes: ChargeCode[];
  currentDay: TrackedDay;
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

  realTotal: number = 0;

  constructor(chargecode: ChargeCode | string) {
    this.chargecode = chargecode;
  }

  get isTotal() {
    return this.chargecode === "Total";
  }

  get week() {
    return [
      this.monday,
      this.tuesday,
      this.wednesday,
      this.thursday,
      this.friday,
      this.saturday,
      this.sunday,
    ];
  }
}

export default class UiTrackedTimesheet extends Component<
  UiTrackedTimesheetArgs
> {
  constructor(owner: unknown, args: UiTrackedTimesheetArgs) {
    super(owner, args);
  }

  @computed(
    "args.timesheet.timeCharged.@each.value",
    "args.timesheet.trackedDays.@each.mode"
  )
  get calculatedTimesheet() {
    const map = new Map();

    this.args.timesheet.trackedDays.forEach((trackedDay) => {
      if (trackedDay.mode !== DayMode.NORMAL) {
        // hello..
        const chargeCode = this.args.chargeCodes.find(
          (cc) => cc.code === trackedDay.mode
        );
        if (chargeCode) {
          const day = moment(trackedDay.date).format("dddd").toLowerCase();
          this.addTimesheetRow(map, chargeCode, day, HOURS_IN_DAY);
        }
      }
    });

    this.args.timesheet?.timeCharged?.map((timeCharged) => {
      const day = moment(timeCharged.date).format("dddd").toLowerCase();
      this.addTimesheetRow(map, timeCharged.chargeCode, day, timeCharged.value);
    });

    // add a totals row
    let result = Array.from(map.values());
    let totals = this.dayTotals(result);

    result = [...result, totals];

    return result;
  }

  addTimesheetRow(
    map: Map<String, TimesheetRow>,
    chargeCode: ChargeCode,
    day: string,
    value: number
  ) {
    let timesheetRow: TimesheetRow;

    if (map.has(chargeCode.id)) {
      timesheetRow = <TimesheetRow>map.get(chargeCode.id);
    } else {
      timesheetRow = new TimesheetRow(chargeCode);
      map.set(chargeCode.id, timesheetRow);
    }

    // TODO feels wrong to cast to any
    (timesheetRow as any)[day] += value;
    timesheetRow["total"] += value;
  }

  dayTotals(values: TimesheetRow[]) {
    const totals = new TimesheetRow("Total");

    values.forEach((timesheetRow: TimesheetRow) => {
      totals.monday += timesheetRow.monday;
      totals.tuesday += timesheetRow.tuesday;
      totals.wednesday += timesheetRow.wednesday;
      totals.thursday += timesheetRow.thursday;
      totals.friday += timesheetRow.friday;
      totals.saturday += timesheetRow.saturday;
      totals.sunday += timesheetRow.sunday;
      totals.total += timesheetRow.total;

      // we now have a total per chargecode, but its real total can't be known until all totals are calculated
    });

    // const accumilatedTotals = this.calcChargableTime( totals.week.reduce((total, result) => (result += total), 0));
    const accumilatedTotals = this.calcChargableTime(
      totals.week.reduce((total, result) => (result += total), 0),
      null
    );
    const accumilatedTotalsFixed = parseFloat(accumilatedTotals.toFixed(1));

    values.forEach((timesheetRow: TimesheetRow) => {
      // work out the real total

      timesheetRow.realTotal = parseFloat(
        (
          (this.calcChargableTime(timesheetRow.total, null) /
            accumilatedTotals) *
          accumilatedTotalsFixed
        ).toFixed(1)
      );
    });

    return totals;
  }

  calcChargableTime(time: number, fixed: number | null = 1) {
    let result = time / 60;
    if (fixed) {
      result = parseFloat(result.toFixed(fixed));
    }
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

  get today() {
    const today = moment().startOf("day");
    const currentTrackedDay = moment(this.args.currentDay.date);

    if (today.isoWeek() === currentTrackedDay.isoWeek()) {
      // same week
      return currentTrackedDay.format("dddd").toLowerCase();
    } else {
      return null;
    }
  }
}
