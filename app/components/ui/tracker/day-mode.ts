import Component from "@glimmer/component";
import { DayMode } from "jikan-ga-nai/interfaces/day-mode";

interface UiDayModeArgs {
  mode: DayMode;
}

export default class UiDayMode extends Component<UiDayModeArgs> {
  constructor(owner: unknown, args: UiDayModeArgs) {
    super(owner, args);
  }

  get display() {
    switch (this.args.mode) {
      case DayMode.NORMAL:
        return "Normal";
      case DayMode.HOL_ANNUAL:
        return "Annual Leave";
      case DayMode.HOL_PERSONAL:
        return "Personal Leave";
      case DayMode.HOL_PUBLIC:
        return "Public Holiday";
      case DayMode.HOL_RDO:
        return "RDO";
      default:
        return "";
    }
  }
}
