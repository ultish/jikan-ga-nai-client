import Controller from "@ember/controller";
// @ts-ignore
import move from "ember-animated/motions/move";
// @ts-ignore
import { fadeOut, fadeIn } from "ember-animated/motions/opacity";
import { toLeft, toRight } from "ember-animated/transitions/move-over";
import resize from "ember-animated/motions/resize";
// @ts-ignore
import { easeOut, easeIn } from "ember-animated/easings/cosine";

export default class Home extends Controller {
  *transition({ receivedSprites }) {
    console.log("tracker2", arguments);
    receivedSprites.forEach((sprite) => {
      move(sprite);
      resize(sprite);
    });
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module "@ember/controller" {
  interface Registry {
    home: Home;
  }
}
