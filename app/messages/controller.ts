import Controller from "@ember/controller";
import { A } from "@ember/array";
import { sort } from "@ember/object/computed";
import { Message } from "jikan-ga-nai/interfaces/message";
import { getObservable } from "ember-apollo-client";
import { tracked } from "@glimmer/tracking";

export default class Messages extends Controller {
  constructor() {
    super(...arguments);
  }

  // Can define a Message interface and make these use that type instead
  msgCache = A<Message>();

  msgObserver?: any;
  @tracked
  windowInFocus = false;

  onRouteActivate = () => {
    this.msgCache.clear();

    this.msgObserver = getObservable(this.model);
    window.onfocus = () => {
      console.log("focus window!");
      this.windowInFocus = true;
    };
    window.onblur = () => {
      console.log("good bye window");
      this.windowInFocus = false;
    };
  };

  onLeaving() {
    window.onfocus = null;
    window.onblur = null;
  }

  get isLoading() {
    // not sure when this is meant to change...
    return this.msgObserver?.lastResult.loading;
  }

  @sort("msgCache", (a, b) => {
    const aId = Number.parseInt(a.id);
    const bId = Number.parseInt(b.id);

    if (aId > bId) {
      return -1;
    } else if (aId < bId) {
      return 1;
    }
    return 0;
  })
  sortedMsgs!: [Message];

  // This is basically how i'm handling subscriptions atm and dealing with
  // the intial model load.
  addToCache = function (this: Messages, msg: Message) {
    this.msgCache.pushObject(msg);
  };
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module "@ember/controller" {
  interface Registry {
    messages: Messages;
  }
}
