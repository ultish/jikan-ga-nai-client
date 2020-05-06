import { helper } from "@ember/component/helper";

export function timesheetHours(params: any, { value }: any) {
  if (value) {
    return value / 6 / 10;
  } else {
    return 0;
  }
}

export default helper(timesheetHours);
