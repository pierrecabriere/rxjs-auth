import AuthClient from "./AuthClient";
import { Client, GraphandPlugin } from "graphand-js";

export interface GraphandPluginOpts {
  defaultToken?: string;
  authClient?: AuthClient | Function;
  execute?: boolean;
  sync?: boolean;
}

const defaultOptions: GraphandPluginOpts = {
  execute: true,
  sync: undefined,
};

let rtSub;
let atSub;

function executor(graphandClient: Client, options: GraphandPluginOpts) {
  const { authClient, defaultToken, sync } = options;

  let client: AuthClient;
  try {
    client = typeof authClient === "function" ? authClient.apply(authClient, arguments) : authClient;
  } catch (e) {
    console.error(e);
  }

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

  const accessToken = graphandClient.getAccessToken();
  if (sync === true || (accessToken && sync !== false)) {
    client.sync();
  }
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
