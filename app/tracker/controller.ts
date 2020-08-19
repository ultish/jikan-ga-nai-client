import Controller from "@ember/controller";
import { alias } from "@ember/object/computed";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import RouterService from "@ember/routing/router-service";

import { queryManager, getObservable, unsubscribe } from "ember-apollo-client";

import CustomApolloService from "jikan-ga-nai/services/custom-apollo";
import { ObservableQuery } from "apollo-client/core/ObservableQuery";

import { task } from "ember-concurrency-decorators";
import { sort, uniqBy } from "@ember/object/computed";
import { tracked } from "@glimmer/tracking";

import { DayMode } from "jikan-ga-nai/interfaces/day-mode";
import queryTrackedDays from "jikan-ga-nai/gql/queries/trackedDays.graphql";
import { GetTrackedDays } from "jikan-ga-nai/interfaces/get-tracked-days";
import { TrackedDay } from "jikan-ga-nai/interfaces/tracked-day";
import mutationCreateTrackedDay from "jikan-ga-nai/gql/mutations/createTrackedDay.graphql";

export default class Tracker extends Controller {
  @service router!: RouterService;
  @service notifications!: any;
  @queryManager({ service: "custom-apollo" }) apollo!: CustomApolloService;

  @tracked
  hasNextPage = false;
  limit = 30;
  cursor: null | string = null;
  observer: ObservableQuery | null = null;
  fetchTrackedDaysQuery: null | GetTrackedDays = null;

  onRouteActivate = () => {
    this.cursor = null;
    this.hasNextPage = false;
    this.observer = null;
    this.fetchTrackedDaysQuery = null;
    this.fetchTrackedDays.perform();
  };

  onLeaving = () => {
    if (this.fetchTrackedDaysQuery) {
      unsubscribe(this.fetchTrackedDaysQuery);
    }
  };

  @alias("router.currentRouteName")
  currentRouteName!: string;

  @action
  async dateAction(date: Date) {
    if (!date) {
      return;
    }
    try {
      const output: any = await this.apollo.mutate({
        mutation: mutationCreateTrackedDay,
        variables: {
          date: date.valueOf(),
          mode: DayMode.NORMAL,
        },
        updateQueries: {
          trackedDays: (prev, { mutationResult }) => {
            prev.trackedDays.edges.pushObject(
              mutationResult?.data?.createTrackedDay
            );
            return prev;
          },
        },
      });

      const newId = output?.createTrackedDay?.id;
      if (newId) {
        this.transitionToRoute("tracker.day", newId);
      }
    } catch (e) {
      if (e.errors.length) {
        const existingId = e.errors[0]?.extensions?.trackeddayId;
        if (existingId) {
          this.transitionToRoute("tracker.day", existingId);
        }
      } else {
        console.error("Apollo Error", e);
      }
    }
  }

  @action
  fetchMoreDays() {
    this.observer?.fetchMore({
      query: queryTrackedDays,
      variables: {
        limit: this.limit,
        cursor: this.cursor,
      },
      updateQuery: (prev: any, { fetchMoreResult }: any) => {
        const prevTrackedDays = prev.trackedDays.edges;
        const newTrackedDays = fetchMoreResult.trackedDays.edges;
        const newCursor = fetchMoreResult.trackedDays.pageInfo.endCursor;

        this.cursor = newCursor;
        this.hasNextPage = fetchMoreResult.trackedDays.pageInfo.hasNextPage;

        return {
          trackedDays: {
            // By returning `cursor` here, we update the `fetchMore` function
            // to the new cursor.
            edges: [...prevTrackedDays, ...newTrackedDays],
            pageInfo: {
              endCursor: newCursor,
              hasNextPage: fetchMoreResult.trackedDays.pageInfo.hasNextPage,
              __typename: prev.trackedDays.pageInfo.__typename,
            },
            __typename: prev.trackedDays.__typename,
          },
        };
      },
    });
  }

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

  @uniqBy("sortedDays", "id")
  uniqSortedDays!: [TrackedDay];

  get moarDisabled() {
    return !this.hasNextPage;
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module "@ember/controller" {
  interface Registry {
    tracker: Tracker;
  }
}
