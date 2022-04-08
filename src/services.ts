import fetch from "node-fetch";

export const openCityProfileBackend: string =
  process.env.OPEN_CITY_PROFILE_API_URL;
export const berthReservationsBackend: string =
  process.env.BERTH_RESERVATIONS_API_URL;

export const defaultHealthCheckPath = "/healthz";

export const testConnectionToBerthReservationsBackend = async () => {
  const response = await fetch(berthReservationsBackend, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
      query StatusQuery {
        berthProfiles {
          edges {
            node {
              id
            }
          }
        }
      }
      `,
    }),
  }).catch((error) =>
  console.error(error)
);
  if (!response || response.status !== 200) {
    console.warn(`The connection to ${berthReservationsBackend} is not healthy.`);
    return false;
  }
  return true;
};

export const testConnectionToOpenCityProfileBackend = async () => {
  const response = await fetch(openCityProfileBackend, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
      query StatusQuery {
        myProfile {
          id
        }
      }
      `,
    }),
  }).catch((error) =>
  console.error(error)
);
  if (!response || response.status !== 200) {
    console.warn(`The connection to ${openCityProfileBackend} is not healthy.`);
    return false;
  }
  return true;
};
