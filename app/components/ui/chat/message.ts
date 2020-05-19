import Component from "@glimmer/component";
import { Message } from "jikan-ga-nai/interfaces/message";
import moment from "moment";

interface UiChatMessageArgs {
  message: Message;
  notifyAction: Function;
}

/**
 * the container will fetch messages and subscribe to message creation.
 */
export default class UiChatMessage extends Component<UiChatMessageArgs> {
  constructor(owner: unknown, args: UiChatMessageArgs) {
    super(owner, args);
  }

  setScrollPosition(element: HTMLElement, [ctx]: UiChatMessage[]) {
    const action = ctx.args.notifyAction;
    if (action) {
      action(element);
    }
  }

  get date() {
    const date = this.args.message.createdAt;

    const day = moment(date).startOf("day");
    const today = moment().startOf("day");

    const m = moment(date);

    if (day.valueOf() === today.valueOf()) {
      return m.fromNow();
    } else {
      return m.format("HH:mm ddd Do MMM YYYY");
    }
  }
}
