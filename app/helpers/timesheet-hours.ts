import { helper } from "@ember/component/helper";

export function timesheetHours(params: any, { value, fixed }: any) {
  if (value) {
    let result = value / 6 / 10;

    if (fixed !== undefined) {
      result = parseFloat(result.toFixed(fixed));
    }

    return result;
  } else {
    return 0;
  }
}

export default helper(timesheetHours);
