import Component from "@glimmer/component";
import { queryManager, getObservable } from "ember-apollo-client";
import ApolloService from "ember-apollo-client/services/apollo";

import { task } from "ember-concurrency-decorators";
import { computed, action, get } from "@ember/object";
import { inject as service } from "@ember/service";
import Authentication from "jikan-ga-nai/services/authentication";
import RouterService from "@ember/routing/router-service";
import { tracked } from "@glimmer/tracking";

import queryMe from "jikan-ga-nai/gql/queries/me.graphql";

interface UiNavbarArgs {}

export default class UiNavbar extends Component<UiNavbarArgs> {
  @queryManager() apollo!: ApolloService;
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
    await this.authentication.logout();

    this.router.transitionTo("login");
  }

  @task({ drop: true })
  fetchMe: any = function* (this: UiNavbar) {
    const login = yield this.authentication.loginWithToken();

    return login;
  };

  @computed("fetchMe.last.value.me.{username,id}")
  get me() {
    console.log(
      "test",
      this.fetchMe.last?.value?.me?.username,
      this.fetchMe.last?.value
    );
    return this.fetchMe.last.value;
  }

  @computed("router.currentRouteName")
  get atLogin() {
    return this.router.currentRouteName === "login";
  }
}
