import { ApolloServer } from "apollo-server";
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import * as dotenv  from "dotenv";

dotenv.config();

const debug: boolean = process.env.DEBUG === "debug" || process.env.ENV !== "production";

const port: number = parseInt(process.env.PORT);

const openCityProfileBackend: string = process.env.OPEN_CITY_PROFILE_API_URL;
const berthReservationsBackend: string = process.env.BERTH_RESERVATIONS_API_URL;


class AuthenticatedDataSource extends RemoteGraphQLDataSource {
    // Make the class accept "name" property
    constructor(
        config?: Partial<AuthenticatedDataSource> &
            object &
            ThisType<AuthenticatedDataSource>,
    ) {
        super();
        if (config) {
            return Object.assign(this, config);
        }
    }
    name!: string;

    willSendRequest({ request, context }) {
        // (context as any) due to typescript-related bug in apollo-gateway:
        // https://github.com/apollographql/apollo-server/issues/3307
        if ((context as any).apiTokens) {
            let apiTokens = JSON.parse((context as any).apiTokens);

            request.http.headers.set(
                "Authorization",
                "Bearer " + apiTokens[this.name]
            );
        }
    }
}


const gateway = new ApolloGateway({
    serviceList: [
        // name of the service is the same as its API scope for auth purposes
        { name: "https://api.hel.fi/auth/profiles", url: openCityProfileBackend },
        { name: "https://api.hel.fi/auth/berths", url: berthReservationsBackend },
    ],
    buildService({ name, url }) {
        return new AuthenticatedDataSource({ name, url });
    },
});


(async () => {
    const server = new ApolloServer({
        gateway,
        subscriptions: false,
        context: ({ req }) => {
            const apiTokens = req.headers["api-tokens"] || "";
            return { apiTokens };
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
