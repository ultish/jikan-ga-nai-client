import Component from "@glimmer/component";
import { queryManager, getObservable, unsubscribe } from "ember-apollo-client";

import ApolloService from "ember-apollo-client/services/apollo";
import { ObservableQuery } from "apollo-client/core/ObservableQuery";

import { task } from "ember-concurrency-decorators";
import { sort } from "@ember/object/computed";
import { computed, action, get } from "@ember/object";
import { inject as service } from "@ember/service";
import Authentication from "jikan-ga-nai/services/authentication";
import RouterService from "@ember/routing/router-service";
import { tracked } from "@glimmer/tracking";

import queryTrackedDays from "jikan-ga-nai/gql/queries/trackedDays.graphql";
import { GetTrackedDays } from "jikan-ga-nai/interfaces/get-tracked-days";
import { TrackedDay } from "jikan-ga-nai/interfaces/tracked-day";

interface PagesTrackerArgs {
  dayId: number;
}

export default class PagesTracker extends Component<PagesTrackerArgs> {
  @queryManager() apollo!: ApolloService;

  // @tracked
  // hasNextPage = false;
  // limit = 10;
  // cursor: null | string = null;
  // observer: ObservableQuery | null = null;
  // fetchTrackedDaysQuery: null | GetTrackedDays = null;

  // constructor(owner: unknown, args: PagesTrackerArgs) {
  //   super(owner, args);
  //   this.fetchTrackedDays.perform();
  // }

  // willDestroy() {
  //   if (this.fetchTrackedDaysQuery) {
  //     // remove our subscription to the watchQuery
  //     unsubscribe(this.fetchTrackedDaysQuery);
  //   }
  //   // if (this.messagesCreatedSub) {
  //   //   this.messagesCreatedSub.apolloUnsubscribe();
  //   // }
  // }

  // @task({ drop: true })
  // fetchTrackedDays: any = function* (this: PagesTracker) {
  //   const trackedDays: GetTrackedDays = yield this.apollo.watchQuery(
  //     {
  //       query: queryTrackedDays,
  //       /*
  //       by using default fetch policy, it will return cached results
  //       once the query has been called once (and cache hasn't expired).

  //       Now the benefit of the fetchMore down below is that it will
  //       update your cached results, so instead of just returning 1
  //       message like this query would, it returns everything that was
  //       added to the query result that's in the cache, that was updated
  //       by the fetchMore function.
  //       */
  //       // fetchPolicy: "cache-and-network",
  //       variables: {
  //         limit: this.limit,
  //         cursor: this.cursor,
  //       },
  //     },
  //     "trackedDays"
  //   );

  //   this.fetchTrackedDaysQuery = trackedDays;
  //   this.observer = getObservable(trackedDays);

  //   // if (this.observer) {
  //   //   this.subscribe(this.observer);
  //   // }

  //   this.cursor = trackedDays.pageInfo.endCursor;

  //   this.hasNextPage = trackedDays.pageInfo.hasNextPage;

  //   return trackedDays;
  // };

  // @sort(
  //   "fetchTrackedDays.lastSuccessful.value.edges",
  //   (a: TrackedDay, b: TrackedDay) => {
  //     const aId = new Date(a.date).getTime();
  //     const bId = new Date(b.date).getTime();

  //     if (aId > bId) {
  //       return -1;
  //     } else if (aId < bId) {
  //       return 1;
  //     }
  //     return 0;
  //   }
  // )
  // sortedDays!: [any];
}