const utils = require("../utils.ts");

describe("service utils", () => {
  describe("removeTrailingSlash", () => {
    it.each([
      ["/", ""],
      ["/profiili/", "/profiili"],
      ["/profiili/graphql", "/profiili/graphql"],
      ["/profiili/graphql/", "/profiili/graphql"],
      ["/profiili/graphql//", "/profiili/graphql"],
    ])(
      "removes the trailing slashes from the end of the %s uri to produce %s",
      (uri: string, result: string) => {
        expect(utils.removeTrailingSlash(uri)).toBe(result);
      }
    );
  });
  describe("getDefaultHealthCheckEndpoint", () => {
    it.each([
      [
        "https://api.hel.fi/profiili/graphql/",
        "https://api.hel.fi/profiili/healthz",
      ],
      [
        "https://api.hel.fi/berths/graphql/",
        "https://api.hel.fi/berths/healthz",
      ],
      [
        "https://api.hel.fi/berths/graphql",
        "https://api.hel.fi/berths/healthz",
      ],
      [
        "https://profile-api.test.hel.ninja/graphql/",
        "https://profile-api.test.hel.ninja/healthz",
      ],
      [
        "https://venepaikat-api.test.hel.ninja/graphql/",
        "https://venepaikat-api.test.hel.ninja/healthz",
      ],
      [
        "https://venepaikat-api.test.hel.ninja/graphql",
        "https://venepaikat-api.test.hel.ninja/healthz",
      ],
    ])("converts the common API url %s to %s", (apiUrl, healthzUrl) => {
      expect(utils.getDefaultHealthCheckEndpoint(apiUrl)).toBe(healthzUrl);
    });
  });
});
