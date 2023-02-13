import { RemoteGraphQLDataSource } from "@apollo/gateway";
import { fetch, Request, Headers } from "apollo-server-env";
import { isObject } from "@apollo/gateway/dist/utilities/predicates";
import * as FormData from "form-data";
import * as _ from "lodash";

/**
 * Custom class wrapper that allows passing files to downstream services.
 *
 * Follows [graphql-multipart-request-spec](https://github.com/jaydenseric/graphql-multipart-request-spec)
 * Based on [this gist](https://gist.github.com/bl42/881d85ee0dd92bbe68e93dcd0c99cfdb)
 *
 * If apollo-server at some point implements the same logic, this custom wrapper can be dropped.
 */
export class FileUploadDataSource extends RemoteGraphQLDataSource {
  async process(args) {
    const { request } = args;

    const fileVariables = this.extract(request.variables);
    if (fileVariables.length > 0) {
      return this.processFileUpload(args, fileVariables);
    } else {
      return super.process(args);
    }
  }

  async processFileUpload(args, fileVariables) {
    const { request, context } = args;
    const form = new FormData();

    // cannot mutate the request object
    const variables = _.cloneDeep(request.variables);
    for (const [variableName] of fileVariables) {
      _.set(variables, variableName, null);
    }

    const operations = JSON.stringify({
      query: request.query,
      variables,
    });

    form.append("operations", operations);

    const resolvedFiles = await Promise.all(
      fileVariables.map(async ([variableName, file]) => {
        const contents = await file;
        return [variableName, contents];
      })
    );

    // e.g. { "0": ["variables.file"] }
    const fileMap = resolvedFiles.reduce(
      (map: Map<any, any>, [variableName], i) => ({
        ...map,
        [i]: [`variables.${variableName}`],
      }),
      {}
    );
    form.append("map", JSON.stringify(fileMap));

    await Promise.all(
      resolvedFiles.map(async ([, contents], i) => {
        const { filename, mimetype, createReadStream } = contents;
        const readStream = await createReadStream();
        // TODO: Buffers performance issues? may be better solution.
        const buffer = await this.onReadStream(readStream);
        form.append(i.toString(), buffer, { filename, contentType: mimetype });
      })
    );

    // Respect incoming http headers (eg, apollo-federation-include-trace).

    const headers = (request.http && request.http.headers) || new Headers();

    form.getLength(function (err, length) {
      headers.set("Content-Length", length);
    });

    Object.entries(form.getHeaders() || {}).forEach(([k, value]) => {
      headers.set(k, value);
    });

    request.http = {
      method: "POST",
      url: this.url,
      headers,
    };
    if (this.willSendRequest) {
      await this.willSendRequest(args);
    }

    const options = {
      ...request.http,
      body: form,
    };

    const httpRequest = new Request(request.http.url, options);
    let httpResponse = undefined;

    try {
      httpResponse = await fetch(httpRequest);

      const body = await this.parseBody(httpResponse);

      if (!isObject(body)) {
        throw new Error(`Expected JSON response body, but received: ${body}`);
      }
      const response = {
        ...body,
        http: httpResponse,
      };

      return response;
    } catch (error) {
      // didEncounterError only throw error ...
      this.didEncounterError(error, httpResponse, httpResponse, context);
      throw error;
    }
  }
  extract(obj) {
    const files = [];

    const _extract = (obj, keys?) =>
      Object.entries(obj || {}).forEach(([k, value]) => {
        const key = keys ? `${keys}.${k}` : k;
        if (value instanceof Promise) {
          return files.push([key, value]);
        }
        // TODO: support arrays of files
        if (value instanceof Object) {
          return _extract(value, key);
        }
      });
    _extract(obj);
    return files;
  }
  onReadStream = (readStream) => {
    return new Promise((resolve, reject) => {
      var buffers = [];
      readStream.on("data", function (data) {
        buffers.push(data);
      });
      readStream.on("end", function () {
        var actualContents = Buffer.concat(buffers);

        resolve(actualContents);
      });
      readStream.on("error", function (err) {
        reject(err);
      });
    });
  };
}

/**
 * Custom class wrapper that holds authentication logic.
 */
export class AuthenticatedDataSource extends FileUploadDataSource {
  // Make the class accept "name" property
  constructor(
    config?: Partial<AuthenticatedDataSource> &
      object &
      ThisType<AuthenticatedDataSource>
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
      request.http.timeout = 10000;
      request.http.headers.set(
        "Authorization",
        "Bearer " + apiTokens[this.name]
      );
    }

    request.http.headers.set(
      "Accept-Language",
      (context as any).acceptLanguage
    );
  }
}
