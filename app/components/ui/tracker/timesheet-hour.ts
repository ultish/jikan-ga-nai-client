import Component from "@glimmer/component";

interface UiTrackedTimesheetHourArgs {
  value: number;
  isTotal: boolean;
}

export default class UiTrackedTimesheet extends Component<
  UiTrackedTimesheetHourArgs
> {
  constructor(owner: unknown, args: UiTrackedTimesheetHourArgs) {
    super(owner, args);
  }

  get display() {
    let result = this.args.value;
    if (!this.args.isTotal) {
      result = result / 60;
    }

    result = parseFloat(result.toFixed(1));

    return result;
  }

  get displayDetailed() {
    let result = this.args.value;
    if (!this.args.isTotal) {
      result = result / 60;
    }
    return parseFloat(result.toFixed(3));
  }
}
