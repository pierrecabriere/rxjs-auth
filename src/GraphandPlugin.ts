import AuthClient, { AuthClientOptions } from "./AuthClient";
import { Client, GraphandPlugin } from "graphand-js";

export interface GraphandPluginOpts {
  defaultToken?: string;
  authClient?: AuthClient | Function;
  authClientOptions?: AuthClientOptions;
  execute?: boolean;
  sync?: boolean;
}

const defaultOptions: GraphandPluginOpts = {
  execute: true,
  sync: undefined,
  authClientOptions: {},
};

function createAuthmanager(graphandClient, opts: AuthClientOptions = {}) {
  return AuthClient.create(graphandClient._options.project, {
    fetchUser: async () => {
      try {
        return await graphandClient.getModel("Account").getCurrent();
      } catch (e) {
        graphandClient.logout();
        return null;
      }
    },
    login: (credentials) => graphandClient.login(credentials),
    refreshToken: () => graphandClient.refreshToken(),
    getAccessToken: () => graphandClient.getAccessToken(),
    getRefreshToken: () => graphandClient.getRefreshToken(),
    ...opts,
  });
}

async function executor(graphandClient: Client, options: GraphandPluginOpts) {
  const { authClient, defaultToken, sync, authClientOptions } = options;

  let client: AuthClient;
  try {
    client = typeof authClient === "function" ? authClient.apply(authClient, arguments) : authClient;
  } catch (e) {
    console.error(e);
  }

  client = client || createAuthmanager(graphandClient, authClientOptions);

  if (!client) {
    throw new Error(`Unable to get the authClient`);
  }

  const graphandLogout = graphandClient.logout;
  const logout = function () {
    client.logout();
    graphandLogout.apply(graphandClient, arguments);
  };

  Object.assign(graphandClient, { __authmanager_rtSub: null, __authmanager_atSub: null, authmanager: client, logout });

  // @ts-ignore
  const { __authmanager_rtSub, __authmanager_atSub } = graphandClient;

  if (__authmanager_atSub?.unsubscribe) {
    __authmanager_atSub.unsubscribe();
  }

  if (__authmanager_rtSub?.unsubscribe) {
    __authmanager_rtSub.unsubscribe();
  }

  await Promise.all([
    new Promise(async (resolve) => {
      if (!graphandClient.getRefreshToken()) {
        const refreshToken = await client.getRefreshToken();
        if (refreshToken) {
          graphandClient.setRefreshToken(refreshToken);
        }
      }

      resolve(true);
    }),
    new Promise(async (resolve) => {
      if (!graphandClient.getAccessToken()) {
        const accessToken = (await client.getAccessToken()) || defaultToken;
        if (accessToken) {
          graphandClient.setAccessToken(accessToken);
        }
      }

      resolve(true);
    }),
  ]);

  const rtSub = graphandClient._refreshTokenSubject.subscribe((token) => client.setRefreshToken(token));
  const atSub = graphandClient._accessTokenSubject.subscribe((token) => {
    if (token === defaultToken) {
      return;
    }

    if (!token) {
      graphandClient.setAccessToken(defaultToken);
    } else if (token !== client.getAccessToken()) {
      client.setAccessToken(token);
    }
  });

  Object.assign(graphandClient, { __authmanager_rtSub: rtSub, __authmanager_atSub: atSub });

  const accessToken = graphandClient.getAccessToken();
  if (sync === true || (accessToken !== defaultToken && sync !== false)) {
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
