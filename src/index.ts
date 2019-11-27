import { ApolloServer } from "apollo-server";
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import * as dotenv  from "dotenv";

dotenv.config();

const debug: boolean = process.env.DEBUG === "debug" || process.env.ENV !== "production";

const port: number = parseInt(process.env.PORT);

const openCityProfileBackend: string = process.env.OPEN_CITY_PROFILE_API_URL;
const berthReservationsBackend: string = process.env.BERTH_RESERVATIONS_API_URL;

const gateway = new ApolloGateway({
    serviceList: [
        { name: 'open-city-profile', url: openCityProfileBackend },
        { name: 'berth-reservations', url: berthReservationsBackend },
    ],
    buildService({ url }) {
        return new RemoteGraphQLDataSource({
            url,
            willSendRequest({ request, context }) {
                request.http.headers.set(
                    "Authorization",
                    // typescript-related bug in apollo-gateway:
                    // https://github.com/apollographql/apollo-server/issues/3307
                    (context as any).token
                );
            }
        });
    }
});


(async () => {
    const server = new ApolloServer({
        gateway,
        subscriptions: false,
        context: ({ req }) => {
            const token = req.headers.authorization || "";
            return { token };
        },
        debug: debug,
        playground: debug,
        introspection: debug   
    });

    server.listen(port).then(({ url }) => {
        // eslint-disable-next-line no-console
        console.log(`🚀 Server ready at ${url}`)
    });
})();
