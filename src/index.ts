import { ApolloServer } from "apollo-server-express";
import { ApolloGateway } from "@apollo/gateway";
import * as cors from "cors";
import * as dotenv from "dotenv";
import * as express from "express";
import { AuthenticatedDataSource } from "./dataSources";
import {
  berthReservationsBackend,
  openCityProfileBackend,
  defaultHealthCheckPath,
  defaultReadinessPath,
} from "./utils";

import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
} from "apollo-server-core";

dotenv.config();

const debug: boolean =
  process.env.DEBUG === "debug" || process.env.NODE_ENV !== "production";

const port: string = process.env.PORT || "3000";

const gateway = new ApolloGateway({
  serviceList: [
    // name of the service is the same as its API scope for auth purposes
    {
      name: process.env.OPEN_CITY_PROFILE_SCOPE, // "https://api.hel.fi/auth/helsinkiprofile"
      url: openCityProfileBackend,
    },
    {
      name: process.env.BERTH_RESERVATIONS_API_SCOPE, // "https://api.hel.fi/auth/berths"
      url: berthReservationsBackend,
    },
  ],
  buildService({ name, url }) {
    return new AuthenticatedDataSource({ name, url });
  },
  serviceHealthCheck: true,
});

const devDebugPlugin = {
  async requestDidStart(requestContext) {
    const output = (stage: String, requestContext: any) => {
      console.log(`-- ${stage} -- context`);
      console.log(requestContext.context);
      console.log(`-- ${stage} -- request`);
      console.log(requestContext.request);
      console.log(`-- ${stage} -- request -- http -- url`);
      console.log(requestContext.request.http.url);
      console.log(`-- ${stage} -- request -- http -- headers`);
      console.log(requestContext.request.http.headers);
      console.log(`-- ${stage} -- response`);
      console.log(requestContext.response);
      const headers = requestContext.response.http.headers[Symbol.iterator]();
      for (const header of headers) {
        console.log(header);
      }
      console.log(`-- ${stage} -- errors`);
      console.log(requestContext.errors);
    };

    if (requestContext.request.query.indexOf("IntrospectionQuery") == -1) {
      console.log("-- requestDidStart");
      return {
        async parsingDidStart(requestContext) {
          output("parsingDidStart", requestContext);
        },

        async validationDidStart(requestContext) {
          output("validationDidStart", requestContext);
        },

        async didEncounterErrors(requestContext) {
          output("didEncounterErrors", requestContext);
        },

        async didResolveOperation(requestContext) {
          output("didResolveOperation", requestContext);
        },

        async executionDidStart(requestContext) {
          output("executionDidStart", requestContext);
        },

        async responseForOperation(requestContext) {
          output("responseForOperation", requestContext);
          return null;
        },

        async willSendResponse(requestContext) {
          output("willSendResponse", requestContext);
        },
      };
    } else return {};
  },
};

(async () => {
  const server = new ApolloServer({
    gateway,
    context: ({ req }) => {
      const apiTokens: string = req.headers["api-tokens"] || "";
      const acceptLanguage: string = req.headers["accept-language"] || "";
      return { apiTokens, acceptLanguage };
    },
    debug: debug,
    introspection: debug,
    plugins:
      debug == true
        ? [devDebugPlugin, ApolloServerPluginLandingPageGraphQLPlayground()]
        : [ApolloServerPluginLandingPageDisabled()],
  });

  const serverStartupStatus = await server
    .start()
    .then(() => {
      console.log("Server startup success.");
      return true;
    })
    .catch((val) => {
      console.log(`Server startup failed: ${val}.`);
      return false;
    });

  const app = express();

  app.use(cors());

  // GraphQL Voyager schema visualization
  if (debug) {
    const voyagerMiddleware = require("graphql-voyager/middleware").express;
    app.use(
      "/voyager",
      voyagerMiddleware({
        endpointUrl: "/graphql",
        displayOptions: {
          sortByAlphabet: true,
        },
      })
    );
  }

  // TODO: check that app actually works
  app.get(defaultReadinessPath, (req, res) => {
    res.status(200).json({ status: "OK" });
  });

  app.get(defaultHealthCheckPath, async (req, res) => {
    const gatewayHealth = gateway.serviceHealthCheck();

    let messages: string[] = [];
    if (!serverStartupStatus) {
      messages.push("Server startup failed.");
    }

    await gatewayHealth.catch((error_val) => {
      const err_message = `Gateway issues: ${error_val}`;
      console.error(err_message);
      messages.push(err_message);
    });

    // 504 Gateway Timeout
    if (messages.length > 0) {
      if (debug === true) {
        console.log("!!!GATEWAY TIMEOUT!!!");
        console.log(messages);
      }
      res.status(504).json({ status: "ERROR", messages });
    } else {
      res.status(200).json({ status: "OK" });
    }
  });

  server.applyMiddleware({
    app,
    path: "/",
    onHealthCheck: () => {
      return gateway.serviceHealthCheck();
    },
  });

  app.listen({ port }, () =>
    // eslint-disable-next-line no-console
    console.log(`🚀 Server ready at http://localhost:${port}`)
  );
})();
