import fetch from "node-fetch";

export const openCityProfileBackend: string =
  process.env.OPEN_CITY_PROFILE_API_URL;
export const berthReservationsBackend: string =
  process.env.BERTH_RESERVATIONS_API_URL;

export const defaultHealthCheckPath = "/healthz";

export const getDefaultBackendReadinessEndpoint = (url: string) => {
  const origin = new URL(url).origin;
  const healthCheckEndpoint = new URL(defaultHealthCheckPath, origin);
  return healthCheckEndpoint.href;
};

export const testConnectionToBerthReservationsBackend = async () => {
  const healthCheckEndpoint = getDefaultBackendReadinessEndpoint(
    berthReservationsBackend
  );
  const response = await fetch(healthCheckEndpoint).catch((error) =>
    console.error(error)
  );
  if (!response || response.status !== 200) {
    console.warn("The connection to the Berth API is not healthy.");
    return false;
  }
  return true;
};

export const testConnectionToOpenCityProfileBackend = async () => {
  const healthCheckEndpoint = getDefaultBackendReadinessEndpoint(
    openCityProfileBackend
  );
  const response = await fetch(healthCheckEndpoint).catch((error) =>
    console.error(error)
  );
  if (!response || response.status !== 200) {
    console.warn("The connection to the Open City Profile is not healthy.");
    return false;
  }
  return true;
};
