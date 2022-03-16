import AuthClient from "./AuthClient";
import { Client, GraphandPlugin } from "graphand-js";

export interface GraphandPluginOpts {
  defaultToken?: string;
  authClient?: AuthClient | Function;
  execute?: boolean;
}

const defaultOptions: GraphandPluginOpts = {
  execute: true,
};

let rtSub;
let atSub;

function executor(graphandClient: Client, options: GraphandPluginOpts) {
  const { authClient, defaultToken } = options;

  const client: AuthClient = typeof authClient === "function" ? authClient.apply(authClient, arguments) : authClient;

  if (atSub?.unsubscribe) {
    atSub.unsubscribe();
  }

  if (rtSub?.unsubscribe) {
    rtSub.unsubscribe();
  }

  if (!graphandClient.getRefreshToken()) {
    const refreshToken = client?.getRefreshToken();
    if (refreshToken) {
      graphandClient.setRefreshToken(refreshToken);
    }
  }

  if (!graphandClient.getAccessToken()) {
    const accessToken = client?.getAccessToken() || defaultToken;
    if (accessToken) {
      graphandClient.setAccessToken(accessToken);
      client.sync();
    }
  }

  rtSub = graphandClient._refreshTokenSubject.subscribe((token) => client.setRefreshToken(token));
  atSub = graphandClient._accessTokenSubject.subscribe((token) => {
    if (token === defaultToken) {
      return;
    }

    if (!token) {
      graphandClient.setAccessToken(defaultToken);
    } else if (token !== client.getAccessToken()) {
      client.setAccessToken(token);
    }
  });
}

const RxjsAuthGraphandPlugin: GraphandPlugin = {
  options: defaultOptions,
  __construct(graphandClient: Client, options: GraphandPluginOpts) {
    if (options.execute) {
      executor(graphandClient, options);
    } else {
      // @ts-ignore
      graphandClient.__initRxjsAuth = (args) => executor(graphandClient, { ...options, ...args });
    }
  },
};

export default RxjsAuthGraphandPlugin;
