import type { AppOpenAPI } from "./types";

import packageJSON from "../../package.json";

const configureOpenAPI = (app: AppOpenAPI) => {
  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: packageJSON.version,
      title: "Social App",
    },
  });
};

export default configureOpenAPI;
