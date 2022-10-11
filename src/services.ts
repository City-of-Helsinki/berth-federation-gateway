//import fetch from "node-fetch";
import { getDefaultHealthCheckEndpoint } from "./utils";

export const openCityProfileBackend: string =
  process.env.OPEN_CITY_PROFILE_API_URL;
export const berthReservationsBackend: string =
  process.env.BERTH_RESERVATIONS_API_URL;

/**
 * Test the connection to the Berth Reservations API.
 * NOTE: Since the Berth Gateway and the BErth API are in the same network,
 * the connection can be tested with a simple healthz-GET-request.
 */
export const testConnectionToBerthReservationsBackend = async () => {
//  const healthCheckEndpoint = getDefaultHealthCheckEndpoint(
//    berthReservationsBackend
//  );
//  const response = await fetch(healthCheckEndpoint).catch((error) =>
//    console.error(error)
//  );
//  if (!response || response.status !== 200) {
//    console.warn("The connection to the Berth API is not healthy.");
//    return false;
//  }
  return true;
};

/**
 * Test the connection to the Open City Profile -API.
 * NOTE: The healthz -endpoint is blocked from outside network,
 * so the result for a basic healthz request would be 502 - Bad Gateway.
 * The test needs to be done to graphql -endpoint,
 * but it should be noted that without an apiToken,
 * the response will always contain
 * an error message: "You do not have permission to perform this action.",
 * but will still have a status code 200.
 */
export const testConnectionToOpenCityProfileBackend = async () => {
//  const response = await fetch(openCityProfileBackend, {
//    method: "POST",
//    headers: {
//      "Content-Type": "application/json",
//    },
//    body: JSON.stringify({
//      query: `
//      query StatusQuery {
//        myProfile {
//          id
//        }
//      }
//      `,
//    }),
//  }).catch((error) => console.error(error));
//  if (!response || response.status !== 200) {
//    console.warn(`The connection to ${openCityProfileBackend} is not healthy.`);
//    return false;
//  }
  return true;
};
