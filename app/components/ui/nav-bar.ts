import Component from "@glimmer/component";
import { queryManager } from "ember-apollo-client";
import CustomApolloService from "jikan-ga-nai/services/custom-apollo";

import { task } from "ember-concurrency-decorators";
import { computed, action, get } from "@ember/object";
import { inject as service } from "@ember/service";
import Authentication from "jikan-ga-nai/services/authentication";
import RouterService from "@ember/routing/router-service";
import { tracked } from "@glimmer/tracking";

interface UiNavbarArgs {}

export default class UiNavbar extends Component<UiNavbarArgs> {
  @queryManager({ service: "custom-apollo" }) apollo!: CustomApolloService;
  @service authentication!: Authentication;
  @service router!: RouterService;

  @tracked
  greetings = "";
  availableGreets = ["Hello", "Welcome", "こんにちは"];
  loginObserver?: any;

  constructor(owner: unknown, args: UiNavbarArgs) {
    super(owner, args);

    this.greetings = this.availableGreets[Math.floor(Math.random() * 3)];
    get(this, "fetchMe").perform();
  }

  @action
  async logout() {
    await this.authentication.logout(true);

    this.router.transitionTo("login");
  }

  @task({ drop: true })
  fetchMe: any = function* (this: UiNavbar) {
    const login = yield this.authentication.loginWithToken();

    return login;
  };

  @computed("fetchMe.last.value.me.{username,id}")
  get me() {
    return this.fetchMe.last.value;
  }

  @computed("router.currentRouteName")
  get atLogin() {
    return this.router.currentRouteName === "login";
  }
}
