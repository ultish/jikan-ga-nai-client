import { queryManager } from "ember-apollo-client";
import messages from "jikan-ga-nai/gql/queries/messages.graphql";
import messageCreated from "jikan-ga-nai/gql/subscriptions/message-created.graphql";

import { addListener, removeListener } from "@ember/object/events";

// importing this for the type reference
import ApolloService from "ember-apollo-client/services/apollo";

import MessagesController from "./controller";
import { GetMessages } from "jikan-ga-nai/interfaces/get-messages";

import AuthRoute from "jikan-ga-nai/framework/auth-route";

export default class Messages extends AuthRoute {
  // ! tells typescrypt this this variable will definately be initialized.
  // otherwise it throws  a TS error as we haven't initialized this var
  @queryManager() apollo!: ApolloService;

  messagesCreatedSub: any;

  constructor() {
    super(...arguments);
  }

  init(...args: any[]) {
    this._super(...args);
  }
  async setupController(
    controller: MessagesController,
    model: GetMessages
  ): Promise<void> {
    super.setupController(controller, model);
    controller.onRouteActivate();

    this.messagesCreatedSub = await this.apollo.subscribe(
      {
        query: messageCreated,
      },
      "messageCreated"
    );

    // TODO it looks like the subscription only fires an event named "event"
    // and you can't seem to change it?
    addListener(this.messagesCreatedSub, "event", this.handleEvent);

    // TODO: not ideal either. Basically nothing is using the model hook
    // in the controller as it's not a live array unless the watchQuery
    // gets triggered to update.
    // I've only gotten it to update by re-running the same graphQL query
    // in the handleEvent function
    // TODO: need to read more on watchQuery and how to make it update
    // from a subscription pov.
    console.log("setup contorller", model);

    model.edges.forEach((msg) => controller.addToCache(msg));
  }

  resetController(
    controller: MessagesController,
    isExiting: boolean,
    transition: { targetName: string }
  ) {
    super.resetController(controller, isExiting, transition);

    if (isExiting) {
      removeListener(this.messagesCreatedSub, "event", this.handleEvent);
    }
  }

  handleEvent = (event: any) => {
    console.log("created", event);

    let controller = this.controller as MessagesController;

    controller.addToCache(event.message);

    // if (this._model) {
    //   const observable = getObservable(this._model);
    //   console.log(observable);
    //   const result = observable.refetch();
    //   debugger;
    // }

    // TODO this re-fetches the entire messages query for 1 subscription
    // event. not ideal...
    /**
     * surely there's a way to update the model with just the payload
     * we were pushed instead of re-running this entire query!
     */
    // await this.apollo.query(
    //   {
    //     query: messages,
    //     fetchPolicy: "network-only"
    //   },
    //   "messages"
    // );

    // without the model using network-only fetchPolicy, it only returns cached results
    // this.model();
  };

  model(): Promise<GetMessages> {
    // watchQuery will update it's results from the Store (apollo cache)
    // whenever someone else re-runs the same query. Not great really,
    // but better than nothing I guess.

    // because this.apollo is typed, watchQuery function breaks if you
    // provide incorrect options to it, even down to the object keys in
    // the first param!

    /*
    setting the fetchPolicy to cache and network will cause this query to
    return immediately with the cached values. It will then subsequently 
    get updated and contain any new values from the network.
    */
    const q = this.apollo.watchQuery(
      {
        query: messages,
        // notifyOnNetworkStatusChange: true,
        fetchPolicy: "cache-and-network", //"network-only" //"cache-and-network"
      },
      /**
       * this is the resultsKey param.
       * It defines where in the payload you want to fetch resutls from.
       * eg our payload looks like:
       * data {
       *    messages: {
       *       edges: [
       *          ...
       *       ]
       *       pageIno: {
       *          ...
       *       }
       *    }
       * }
       *
       * so you can say "messages" to get everything, or "messages.edges"
       * to only get the actual message content
       */
      "messages"
    ) as Promise<GetMessages>;

    q.then((msgs) => {
      console.log("model hook", msgs);
    });

    // this.set("_model", q);
    return q;
  }
}
