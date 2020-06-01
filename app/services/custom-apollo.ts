import ApolloService from "ember-apollo-client/services/apollo";
import { split } from "apollo-link";
import { getMainDefinition } from "apollo-utilities";
import { WebSocketLink } from "apollo-link-ws";
import { setContext } from "apollo-link-context";
import { onError } from "apollo-link-error";
import { ServerError } from "apollo-link-http-common";
import { inject as service } from "@ember/service";
import RouterService from "@ember/routing/router-service";
import Authentication from "./authentication";

// Create a WebSocket link:
const wsLink = new WebSocketLink({
  uri: `ws://localhost:9998/graphql`,
  options: {
    reconnect: true,
  },
});

export default class CustomApollo extends ApolloService {
  @service router!: RouterService;
  @service authentication!: Authentication;

  apolloClient: any;

  link() {
    let httpLink: any = super.link();

    // Middleware
    let authMiddleware = setContext(async (request, context) => {
      // let token: string | null = this.authentication.getToken;
      let token = this.authentication.getToken();

      if (token) {
        context.headers = {
          "x-token": token,
        };
      }
      return context;
    });

    // Afterware
    const resetToken = onError((err) => {
      console.warn(err);
      const { graphQLErrors, networkError } = err;

      const error = networkError as ServerError;
      if (error && (error.statusCode === 400 || error.statusCode === 401)) {
        // remove cached token on 401 from the server
        this.authentication.logout(true);
      }

      if (graphQLErrors) {
        console.error("i detect error 🤖", graphQLErrors);
      }
    });

    const authLink = authMiddleware.concat(resetToken);
    const combinedLink = authLink.concat(httpLink);
    return split(
      // split based on operation type
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      wsLink,
      combinedLink
    );
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module "@ember/service" {
  interface Registry {
    apollo: CustomApollo;
  }
}
