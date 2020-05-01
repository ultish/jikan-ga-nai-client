import Controller from "@ember/controller";
import { alias } from "@ember/object/computed";
import { inject as service } from "@ember/service";
import RouterService from "@ember/routing/router-service";

import { toLeft, toRight } from "ember-animated/transitions/move-over";
import move from "ember-animated/motions/move";
import { parallel } from "ember-animated";
import resize from "ember-animated/motions/resize";
import { fadeOut, fadeIn } from "ember-animated/motions/opacity";
import { easeOut, easeIn } from "ember-animated/easings/cosine";

import { queryManager, getObservable, unsubscribe } from "ember-apollo-client";

import ApolloService from "ember-apollo-client/services/apollo";
import { ObservableQuery } from "apollo-client/core/ObservableQuery";

import { task } from "ember-concurrency-decorators";
import { sort } from "@ember/object/computed";
import { tracked } from "@glimmer/tracking";

import queryTrackedDays from "jikan-ga-nai/gql/queries/trackedDays.graphql";
import { GetTrackedDays } from "jikan-ga-nai/interfaces/get-tracked-days";
import { TrackedDay } from "jikan-ga-nai/interfaces/tracked-day";

export default class Tracker extends Controller {
  @service router!: RouterService;
  @queryManager() apollo!: ApolloService;

  @tracked
  hasNextPage = false;
  limit = 10;
  cursor: null | string = null;
  observer: ObservableQuery | null = null;
  fetchTrackedDaysQuery: null | GetTrackedDays = null;

  onRouteActivate = () => {
    this.fetchTrackedDays.perform();
  };

  @alias("router.currentRouteName")
  currentRouteName!: string;

  @task({ drop: true })
  fetchTrackedDays: any = function* (this: Tracker) {
    const trackedDays: GetTrackedDays = yield this.apollo.watchQuery(
      {
        query: queryTrackedDays,
        /*
        by using default fetch policy, it will return cached results
        once the query has been called once (and cache hasn't expired).

        Now the benefit of the fetchMore down below is that it will
        update your cached results, so instead of just returning 1
        message like this query would, it returns everything that was
        added to the query result that's in the cache, that was updated
        by the fetchMore function.
        */
        // fetchPolicy: "cache-and-network",
        variables: {
          limit: this.limit,
          cursor: this.cursor,
        },
      },
      "trackedDays"
    );

    this.fetchTrackedDaysQuery = trackedDays;
    this.observer = getObservable(trackedDays);

    // if (this.observer) {
    //   this.subscribe(this.observer);
    // }

    this.cursor = trackedDays.pageInfo.endCursor;

    this.hasNextPage = trackedDays.pageInfo.hasNextPage;

    return trackedDays;
  };

  @sort(
    "fetchTrackedDays.lastSuccessful.value.edges",
    (a: TrackedDay, b: TrackedDay) => {
      const aId = new Date(a.date).getTime();
      const bId = new Date(b.date).getTime();

      if (aId > bId) {
        return -1;
      } else if (aId < bId) {
        return 1;
      }
      return 0;
    }
  )
  sortedDays!: [any];

  *transition({ insertedSprites }) {
    console.log("tracker2", arguments);
    insertedSprites.forEach((sprite) => {
      sprite.startAtPixel({ x: -200 });
      // parallel(move(sprite(sprite)));
      move(sprite);
      // resize(sprite);
    });
  }

  // *transition({ insertedSprites }) {
  //   console.log("tracker", arguments);
  //   insertedSprites.forEach((sprite) => {
  //     sprite.startAtPixel({ x: -250 });
  //     move(sprite);
  //     fadeIn(sprite);
  //   });
  // }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module "@ember/controller" {
  interface Registry {
    tracker: Tracker;
  }
}
