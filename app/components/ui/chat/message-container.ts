import Component from "@glimmer/component";
import { queryManager, getObservable, unsubscribe } from "ember-apollo-client";

import CustomApolloService from "jikan-ga-nai/services/custom-apollo";
import { ObservableQuery } from "apollo-client/core/ObservableQuery";

import { task } from "ember-concurrency-decorators";
import { action } from "@ember/object";
import { sort } from "@ember/object/computed";
import { isPresent } from "@ember/utils";
import { tracked } from "@glimmer/tracking";
import { debounce } from "@ember/runloop";

import { Message } from "jikan-ga-nai/interfaces/message";

import { GetMessages } from "jikan-ga-nai/interfaces/get-messages";
import queryMessages from "jikan-ga-nai/gql/queries/messages.graphql";
import mutateCreateMessage from "jikan-ga-nai/gql/mutations/createMessage.graphql";
import subMessageCreated from "jikan-ga-nai/gql/subscriptions/message-created.graphql";

interface UiChatMessageContainerArgs {}

/**
 * the container will fetch messages and subscribe to message creation.
 */
export default class UiChatMessageContainer extends Component<
  UiChatMessageContainerArgs
> {
  @queryManager({ service: "custom-apollo" }) apollo!: CustomApolloService;

  constructor(owner: unknown, args: UiChatMessageContainerArgs) {
    super(owner, args);

    this.fetchMessages.perform();
  }

  @tracked
  hasNextPage = false;
  @tracked
  text = "";
  @tracked
  windowInFocus = true;
  @tracked
  resetLastViewed = false;
  @tracked
  lastViewedId?: string;
  @tracked
  firstLoad = true;

  cursor: null | string = null;
  getMessagesQuery: null | GetMessages = null;
  observer: ObservableQuery | null = null;
  messagesCreatedSub: any;
  chatContainer?: HTMLElement;
  chatContents?: HTMLElement;

  limit = 30;

  willDestroy() {
    window.onfocus = null;
    window.onblur = null;

    if (this.getMessagesQuery) {
      // remove our subscription to the watchQuery
      unsubscribe(this.getMessagesQuery);
    }
    if (this.messagesCreatedSub) {
      this.messagesCreatedSub.apolloUnsubscribe();
    }
  }

  @action
  didInsert() {
    this.scrollToPosition();

    // set initial state
    this.windowInFocus = document.hasFocus();

    window.onfocus = () => {
      this.windowInFocus = true;
      this.resetLastViewed = true;
    };
    window.onblur = () => {
      this.windowInFocus = false;
    };
  }
  /**
   * The debounce does 2 things, stop us from spamming the scroll from
   * new messages being rendered, and actually allow the next runloop
   * to occur as this.chatContents and this.chatContainer aren't set
   * until then.
   */
  @action
  notifyScroll() {
    if (this.sortedMsgs && this.windowInFocus) {
      const lastMsg = [...this.sortedMsgs].pop();
      this.lastViewedId = lastMsg.id;
    }
    debounce(this, this.scrollToPosition, 200);
  }

  scrollToPosition() {
    const chatHeight = this.chatContents?.clientHeight;
    if (chatHeight) {
      this.chatContainer?.scroll(0, chatHeight);
    }
  }

  async subscribe(observer: ObservableQuery) {
    observer.subscribeToMore({
      document: subMessageCreated,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) {
          return prev;
        }

        const newMsg = subscriptionData.data.messageCreated.message;
        const prevMsgs = prev.messages.edges;
        const prevPageInfo = prev.messages.pageInfo;
        const found = prevMsgs.find((msg: Message) => msg.id === newMsg.id);

        if (found) {
          // already have this msg
          return prev;
        }

        // when a new msg arrives, check if we are not in focus and if we need to reset the
        // last viewed to be the last msg in the previous list
        if (!this.windowInFocus && this.resetLastViewed) {
          const latestMsg = [...prevMsgs].sortBy("id").pop();
          if (latestMsg) {
            // mark this msg as latest
            this.lastViewedId = latestMsg.id;
            this.resetLastViewed = false;
          }
        }

        const newCache = {
          messages: {
            edges: [newMsg, ...prev.messages.edges],
            pageInfo: {
              endCursor: prevPageInfo.endCursor,
              hasNextPage: prevPageInfo.hasNextPage,
              __typename: prevPageInfo.__typename,
            },
            __typename: prev.messages.__typename,
          },
        };

        return newCache;
      },
    });
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

    if (this.observer) {
      this.subscribe(this.observer);
    }

    this.cursor = messages.pageInfo.endCursor;

    this.hasNextPage = messages.pageInfo.hasNextPage;

    if (this.firstLoad) {
      this.firstLoad = false;
      const sorted = messages.edges.sort((a, b) => {
        const aId = Number.parseInt(a.id);
        const bId = Number.parseInt(b.id);

        if (aId > bId) {
          return 1;
        } else if (aId < bId) {
          return -1;
        }
        return 0;
      });
      if (sorted.length) {
        this.lastViewedId = [...sorted].pop()?.id;
      }
    }

    return messages;
  };

  /*
  This computed sort works because the template file refers to the
  key 'sortedMsgs', which in turn refers to 'edges'. 'edges' is a
  tracked property because of this, and it gets notified of changes
  by ember-apollo-client performing Ember.setProperties() against
  the apollo cached object when getting updates to the cache.

  So no magic here, just Ember tracking properties as it said it
  would with it's auto-tracking features, and ember-apollo-client
  performing the correct 'set' functions that trigger Ember's
  reactive code
  */
  @sort("fetchMessages.lastSuccessful.value.edges", (a, b) => {
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

  sorter(a: any, b: any) {
    const aId = Number.parseInt(a.id);
    const bId = Number.parseInt(b.id);

    if (aId > bId) {
      return 1;
    } else if (aId < bId) {
      return -1;
    }
    return 0;
  }

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
  async fetchMore() {
    try {
      await this.observer?.fetchMore({
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
    } catch (e) {
      console.warn("fetch more error", e);
    }
  }

  @action
  async createMessage(e: Event) {
    e.preventDefault();

    if (!isPresent(this.text)) {
      return;
    }
    try {
      await this.apollo.mutate({
        mutation: mutateCreateMessage,
        variables: {
          text: this.text,
        },
        update: (cache, result) => {
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

          // use ?? to default values, won't be interpreted until necessary unlike ||
          const currentMessages = cachedMessages?.messages?.edges ?? [];
          const currentPageInfo = cachedMessages.messages.pageInfo;

          const found = currentMessages.find(
            (msg: Message) => msg.id === newMessage.id
          );

          let messages = [...currentMessages];
          if (!found) {
            messages.pushObject(newMessage);
          }

          const newCache = {
            messages: {
              edges: messages,
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
        },
      });
    } catch (e) {
      console.log(e);
    }
    this.text = "";
  }

  get moarDisabled() {
    return !this.hasNextPage;
  }
}
