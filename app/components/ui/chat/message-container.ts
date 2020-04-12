import Component from "@glimmer/component";
import { queryManager, getObservable, unsubscribe } from "ember-apollo-client";

import ApolloService from "ember-apollo-client/services/apollo";

import { task } from "ember-concurrency-decorators";
import { computed, action, observer } from "@ember/object";
import { sort } from "@ember/object/computed";
import { isPresent } from "@ember/utils";

import { tracked } from "@glimmer/tracking";

import { GetMessages } from "jikan-ga-nai/interfaces/get-messages";
import queryMessages from "jikan-ga-nai/gql/queries/messages.graphql";
import mutateCreateMessage from "jikan-ga-nai/gql/mutations/createMessage.graphql";

import messageCreated from "jikan-ga-nai/gql/subscriptions/message-created.graphql";

import { on } from "@ember/object/evented";
interface UiChatMessageContainerArgs {}

/**
 * the container will fetch messages and subscribe to message creation.
 */
export default class UiChatMessageContainer extends Component<
  UiChatMessageContainerArgs
> {
  @queryManager() apollo!: ApolloService;

  constructor(owner: unknown, args: UiChatMessageContainerArgs) {
    super(owner, args);

    this.fetchMessages.perform();
  }

  @tracked
  hasNextPage = false;
  @tracked
  text = "";

  cursor?: string;
  getMessagesQuery?: GetMessages;
  observer?: any;

  limit = 1;

  willDestroy() {
    if (this.getMessagesQuery) {
      unsubscribe(this.getMessagesQuery);
    }
  }

  get moarDisabled() {
    return !this.hasNextPage;
  }

  @task({ drop: true })
  fetchMessages: any = function* (this: UiChatMessageContainer) {
    const messages: GetMessages = yield this.apollo.watchQuery(
      {
        query: queryMessages,
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
      "messages"
    );

    this.getMessagesQuery = messages;
    this.observer = getObservable(messages);
    this.cursor = messages.pageInfo.endCursor;

    console.log("fetch messages cursor", this.cursor);

    this.hasNextPage = messages.pageInfo.hasNextPage;

    console.log("fetch messages computing...");

    return messages;
  };

  /*
  currently this needs @computed so that the @sort below will fire.
  lastSuccessful.value will return nothing at init so the sortedMsgs 
  returns nothing and requires this computed value to re-calculate
  for sortedMsgs to recalculate. 

  May be a better way to do this.
  */
  @computed("fetchMessages.lastSuccessful.value")
  get messages(): GetMessages {
    const messages = this.fetchMessages.lastSuccessful?.value;

    console.log("messages computing...", messages);
    return messages;
  }

  /*
  Interesting, this actually works and fires correctly even though messages.edges is 
  a Plain array 🤔

  Why I think it works:
  Because messsages is also a get() function, it gains tracking in Ember. This 
  tracking will notify others when the array changes and so this computed sort
  will get notified.
  */
  @sort("messages.edges", (a, b) => {
    console.log("sorting now...");

    const aId = Number.parseInt(a.id);
    const bId = Number.parseInt(b.id);

    if (aId > bId) {
      return 1;
    } else if (aId < bId) {
      return -1;
    }
    return 0;
  })
  sortedMsgs!: [any];

  /**
   * This function fetches more messages from the server using the
   * 'endCursor' that comes down as part of fetching messages. This
   * is how pagination is done at the serveriside of this app.
   *
   * The fetchMore is a function of the observable from the
   * watchQuery result, allowing us to refetch, fetchMore etc.
   * As part of fetchMore, you must define the updateQuery
   * function that tells apollo how to update the cache with
   * the new values coming back. Here, we're appending the new
   * messages to the front of the messages.edges array, which
   * will update the display automatically (like a live array
   * in ED). This is a lot more work though than ED 😜
   */
  @action
  fetchMore() {
    this.observer?.fetchMore({
      query: queryMessages,
      variables: {
        limit: this.limit,
        cursor: this.cursor,
      },
      updateQuery: (previousResult: any, { fetchMoreResult }: any) => {
        const previousEntry = previousResult.messages;
        const newMessages = fetchMoreResult.messages.edges;
        const newCursor = fetchMoreResult.messages.pageInfo.endCursor;

        this.cursor = newCursor;
        this.hasNextPage = fetchMoreResult.messages.pageInfo.hasNextPage;

        return {
          messages: {
            // By returning `cursor` here, we update the `fetchMore` function
            // to the new cursor.
            edges: [...newMessages, ...previousEntry.edges],
            pageInfo: {
              endCursor: newCursor,
              hasNextPage: fetchMoreResult.messages.pageInfo.hasNextPage,
              __typename: previousEntry.pageInfo.__typename,
            },
            __typename: previousEntry.__typename,
          },
        };
      },
    });
  }

  @action
  async createMessage(e: Event) {
    e.preventDefault();

    if (!isPresent(this.text)) {
      return;
    }

    await this.apollo.mutate({
      mutation: mutateCreateMessage,
      variables: {
        text: this.text,
      },
      update: (cache, result) => {
        console.log(queryMessages);

        /*
        we can read the query from the cache without providing any variables
        here because we've set the messages.graphql with a @connection 
        directive that gives the query a stable key in the cache. Because
        the paramaters in the directive ignore all other fields, any read
        request from the cache for queryMessages will result in the same 
        object being returned. 

        This means you can have multiple readQuery/writeQuery components all
        updating each other and returning the same result.
        */
        const cachedMessages: any = cache.readQuery({
          query: queryMessages,
        });

        const newMessage = result?.data?.createMessage;

        const currentMessages = cachedMessages?.messages?.edges ?? [];

        // const newCacheMessages = [newMessage].concat(currentMessages);
        // const newCacheMessages = currentMessages.concat(newMessage);

        const currentPageInfo = cachedMessages.messages.pageInfo;

        const newCache = {
          messages: {
            edges: [...currentMessages, newMessage],
            pageInfo: {
              endCursor: currentPageInfo.endCursor,
              hasNextPage: currentPageInfo.hasNextPage,
              __typename: currentPageInfo.__typename,
            },
            __typename: cachedMessages.messages.__typename,
          },
        };

        cache.writeQuery({
          query: queryMessages,
          data: newCache,
        });

        console.log("data updated in cache", newCache);
      },
    });

    this.text = "";
  }
}
