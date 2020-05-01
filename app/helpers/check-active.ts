import Ember from "ember";
import { isPresent } from "@ember/utils";
import { inject as service } from "@ember/service";
const { Helper } = Ember;

export default Helper.extend({
  router: service("router"),

  compute([routeName, currentURL, ...models]: [string, string, any]) {
    let router = this.get("router");
    // use currentURL
    currentURL;

    if (isPresent(models)) {
      return router.isActive(routeName, ...models);
    } else {
      return router.isActive(routeName);
    }
  },
});
