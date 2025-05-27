import type { AppOpenAPI } from "./types";
import { Scalar } from "@scalar/hono-api-reference";

import packageJSON from "../../package.json";

const configureOpenAPI = (app: AppOpenAPI) => {
  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: packageJSON.version,
      title: "Social App",
    },
  });

  app.get(
    "/reference",
    Scalar({
      url: "/doc",
      theme: "laserwave",
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "fetch",
      },
    }),
  );
};

export default configureOpenAPI;
