export const defaultHealthCheckPath = "/healthz";

export const removeTrailingSlash = (str: string) => {
  return str.replace(/\/+$/, "");
};

/**
 * Converts the API path to a health check path using the most common patterns of City of Helsinki.
 * Replaces the last entry of the path name with healthz-endpoint -path.
 * Examples:
 * - https://api.hel.fi/profiili/graphql/ -> https://api.hel.fi/profiili/healthz
 * - https://api.hel.fi/berths/graphql/ -> https://api.hel.fi/berths/healthz
 * - https://profile-api.test.hel.ninja/graphql/ -> https://profile-api.test.hel.ninja/healthz
 * - https://venepaikka-api.test.kuva.hel.ninja/graphql/ -> https://venepaikka-api.test.kuva.hel.ninja/healthz
 */
export const getDefaultHealthCheckEndpoint = (url: string) => {
  const apiEndpoint = new URL(url);
  const pathName = removeTrailingSlash(apiEndpoint.pathname);
  const serverRootPath = pathName.substring(0, pathName.lastIndexOf("/"));
  const healthCheckEndpoint = new URL(
    serverRootPath + defaultHealthCheckPath,
    apiEndpoint.origin
  );
  return healthCheckEndpoint.href;
};
