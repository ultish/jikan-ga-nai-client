import Component from "@glimmer/component";
import { queryManager } from "ember-apollo-client";
import ApolloService from "ember-apollo-client/services/apollo";
import queryMe from "jikan-ga-nai/gql/queries/me.graphql";

import { task } from "ember-concurrency-decorators";
import { computed, action, get } from "@ember/object";
import { inject as service } from "@ember/service";
import Authentication from "jikan-ga-nai/services/authentication";
import RouterService from "@ember/routing/router-service";
import { tracked } from "@glimmer/tracking";

interface UiNavbarArgs {}

export default class UiNavbar extends Component<UiNavbarArgs> {
  @queryManager() apollo!: ApolloService;
  @service authentication!: Authentication;
  @service router!: RouterService;

  @tracked
  greetings = "";
  availableGreets = ["Hello", "Welcome", "こんにちは"];

  constructor(owner: unknown, args: UiNavbarArgs) {
    super(owner, args);

    this.greetings = this.availableGreets[Math.floor(Math.random() * 3)];
    get(this, "fetchMe").perform();
  }

  @action
  async logout() {
    await this.authentication.logout();
    debugger;

    // this also works, but it's strange that i have to call fetchMe after
    // login to "clear" the state. Effectively the computed proprerty acts
    // as the trigger to the updated "store" value
    await this.fetchMe.perform();

    this.router.transitionTo("login");
  }

  @task({ drop: true })
  fetchMe: any = function* (this: UiNavbar) {
    console.log("task fetch");
    return yield this.authentication.loginWithToken();
  };

  @computed("fetchMe.lastSuccessful.value")
  get me() {
    /*
    nothing actually will recompute this unforunately.

    even tho at logout we clear the apollo cache, it's not linked
    to the object returned from the fetchMe task for some reason.
    I'm sure if we tried to re-fetch the fetchMe task, it would return 
    nothing and hence update the username, but that defeats the point.


    OR
    Should we be subscribing to a LOGOUT event instead? and then 
    subscribe to it here so we know when to refetch???
    is that inefficient?
      // seems silly to do this as the logout action just clears the 
      // x-token and the server side has no other action
    */
    console.log("me? ", this.fetchMe.lastSuccessful?.value);
    return this.fetchMe.lastSuccessful?.value;
  }
}
