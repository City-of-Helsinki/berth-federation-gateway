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
  ApolloServerPluginLandingPageDisabled 
} from 'apollo-server-core';

dotenv.config();

const debug: boolean =
  process.env.DEBUG === "debug" || process.env.NODE_ENV !== "production";

const port: string = process.env.PORT || "3000";

const gateway = new ApolloGateway({
  serviceList: [
    // name of the service is the same as its API scope for auth purposes
    {
      name: "https://api.hel.fi/auth/helsinkiprofile",
      url: openCityProfileBackend,
    },
    { name: "https://api.hel.fi/auth/berths", url: berthReservationsBackend },
  ],
  buildService({ name, url }) {
    return new AuthenticatedDataSource({ name, url });
  },
  serviceHealthCheck: true,
});

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
    plugins: [
      // Playground
      debug == true ? ApolloServerPluginLandingPageGraphQLPlayground() : ApolloServerPluginLandingPageDisabled(),
    ],
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
