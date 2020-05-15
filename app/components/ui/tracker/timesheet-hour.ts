import Component from "@glimmer/component";

interface UiTrackedTimesheetHourArgs {
  value: number;
}

export default class UiTrackedTimesheet extends Component<
  UiTrackedTimesheetHourArgs
> {
  constructor(owner: unknown, args: UiTrackedTimesheetHourArgs) {
    super(owner, args);
  }

  get display() {
    let result = this.args.value / 60;
    result = parseFloat(result.toFixed(3));

    return result;
  }
}
