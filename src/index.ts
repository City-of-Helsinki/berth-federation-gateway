import { ApolloServer } from "apollo-server-express";
import { ApolloGateway } from "@apollo/gateway";
import * as cors from "cors";
import * as dotenv from "dotenv";
import * as express from "express";
import { AuthenticatedDataSource } from "./dataSources";
import {
  berthReservationsBackend,
  openCityProfileBackend,
  testConnectionToBerthReservationsBackend,
  testConnectionToOpenCityProfileBackend,
} from "./services";

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
  // "Polling running services is dangerous and not recommended in production.
  // Polling should only be used against a registry.
  // If you are polling running services, use with caution"
  // - https://github.com/apollographql/apollo-server/discussions/4280.
  // experimental_pollInterval: 600000, // every 10 min
});

(async () => {
  const server = new ApolloServer({
    gateway,
    subscriptions: false,
    context: ({ req }) => {
      const apiTokens: string = req.headers["api-tokens"] || "";
      const acceptLanguage: string = req.headers["accept-language"] || "";
      return { apiTokens, acceptLanguage };
    },
    debug: debug,
    playground: debug,
    introspection: debug,
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
  app.get("/readiness", (req, res) => {
    res.status(200).json({ status: "OK" });
  });

  app.get("/healthz", async (req, res) => {
    //TODO: Checking the health with custom test connection functions should be pointless since the healthcheck is done already by the ApolloGateway instance (serviceHealthCheck: true in GatewayConfig).
    // ...Left here for monitoring.

    const isBerthApiHealthy = await testConnectionToBerthReservationsBackend();
    const isProfileApiHealthy = await testConnectionToOpenCityProfileBackend();
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

    if (!isBerthApiHealthy) {
      messages.push("Connection issues with the Berth API.");
    }
    if (!isProfileApiHealthy) {
      messages.push("Connection issues with the Open City Profile API.");
    }
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
