import { Client, GraphandPlugin } from "graphand-js";
import AuthClient, { AuthClientOptions } from "./AuthClient";

export interface RxjsAuthGraphandPluginOpts {
  defaultToken?: string;
  authClient?: AuthClient | ((...any) => AuthClient);
  authClientOptions?: AuthClientOptions;
  execute?: boolean;
  sync?: boolean;
}

const defaultOptions: RxjsAuthGraphandPluginOpts = {
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

async function executor(graphandClient: Client, options: RxjsAuthGraphandPluginOpts) {
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

  const grahandLogout = graphandClient.logout;
  const clientLogout = client.logout;

  graphandClient.logout = function (...args) {
    clientLogout.apply(client);
    grahandLogout.apply(graphandClient, args);
    return this;
  };

  client.logout = function (...args) {
    clientLogout.apply(client, args);
    grahandLogout.apply(graphandClient);
    return this;
  };

  Object.assign(graphandClient, { __authmanager_rtSub: null, __authmanager_atSub: null, authmanager: client });

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

class RxjsAuthGraphandPlugin extends GraphandPlugin<RxjsAuthGraphandPluginOpts> {
  static defaultOptions = defaultOptions;

  onInstall(): any {
    const { client, options } = this;

    if (options.execute) {
      executor(client, options);
    } else {
      // @ts-ignore
      client.__initRxjsAuth = (args) => executor(client, { ...options, ...args });
    }
  }
}

export default RxjsAuthGraphandPlugin;
