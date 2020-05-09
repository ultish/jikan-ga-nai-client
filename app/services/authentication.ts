import Service from "@ember/service";
import { tracked } from "@glimmer/tracking";
import { GetMe } from "jikan-ga-nai/interfaces/get-me";
import { queryManager, getObservable } from "ember-apollo-client";
import queryMe from "jikan-ga-nai/gql/queries/me.graphql";
import User from "jikan-ga-nai/models/user";

import signIn from "jikan-ga-nai/gql/mutations/signIn.graphql";
import { SignIn } from "jikan-ga-nai/interfaces/sign-in";

export default class Authentication extends Service {
  @queryManager() apollo!: any;

  @tracked
  authedMe: User | null = null;

  @tracked
  token?: string;

  fetchMe?: GetMe;

  getToken() {
    if (!this.token) {
      // check if we have it in local storage
      this.token = localStorage.getItem("x-token") || undefined;
    }

    return this.token;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("x-token", token);
  }

  async logout() {
    this.token = undefined;
    this.authedMe = null;
    localStorage.setItem("x-token", "");

    await this.apollo.apolloClient.resetStore();
  }

  async login(username: string, password: string) {
    try {
      const login: SignIn = await this.apollo.mutate({
        mutation: signIn,
        variables: {
          login: username,
          password: password,
        },
      });

      this.setToken(login.signIn.token);

      const me = login.signIn.user;
      this.authedMe = new User(me.id, me.username, me.email, me.role);

      // TODO: this is a bit odd. Without re-querying apollo, it maintains a connection that
      // isn't logged in. So logging in again here by making a query via the new token will
      // re-create the apollo link but this time with the new token..

      // refetchQueries doesn't work as the x-token isn't set yet...
      // so here we want to refresh the cached query for ME
      // await this.loginWithToken();

      // reset the cache and re-query all existing queries
      await this.apollo.apolloClient.resetStore();
    } catch (e) {
      console.warn(e);
      throw e;
    }
  }

  async loginWithToken(reset: boolean = false) {
    let result = this.fetchMe;

    if (result) {
      const observable = getObservable(result);

      let refetched = await observable?.refetch();
      refetched = refetched.data;

      const me = refetched.me;
      if (me) {
        this.authedMe = new User(me.id, me.username, me.email, me.role);
      } else {
        this.authedMe = null;
      }
    } else {
      try {
        result = await this.apollo.watchQuery({
          query: queryMe,
        });
        this.fetchMe = result;

        const me = result?.me;
        if (me) {
          this.authedMe = new User(me.id, me.username, me.email, me.role);
        } else {
          this.authedMe = null;
        }
      } catch (e) {
        this.authedMe = null;
        console.warn("Invalid login...");
        throw e;
      }
    }

    if (reset) {
      this.apollo.apolloClient.resetStore();
    }
    console.log("loginWithToken", result);
    return result;
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module "@ember/service" {
  interface Registry {
    authentication: Authentication;
  }
}
