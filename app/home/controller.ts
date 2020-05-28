import Controller from "@ember/controller";
// @ts-ignore
import move from "ember-animated/motions/move";
import resize from "ember-animated/motions/resize";

export default class Home extends Controller {
  *transition({ receivedSprites }: any) {
    receivedSprites.forEach((sprite: any) => {
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
