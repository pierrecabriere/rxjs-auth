import AuthClient from "./AuthClient";

export interface GraphandPluginOpts {
  defaultToken?: string;
  authClient: AuthClient;
}

const GraphandPlugin = (graphandClient, options: GraphandPluginOpts) => {
  const { authClient, defaultToken } = options;

  if (!graphandClient.accessToken) {
    graphandClient.setAccessToken(authClient?.getAccessToken() || defaultToken);
  }

  if (!graphandClient.refreshToken) {
    graphandClient.setRefreshToken(authClient?.getRefreshToken());
  }

  graphandClient._refreshTokenSubject.subscribe((token) => authClient.setRefreshToken(token));
  graphandClient._accessTokenSubject.subscribe((token) => {
    if (token === defaultToken) {
      return;
    }

    if (!token) {
      graphandClient.setAccessToken(defaultToken);
    } else if (token !== authClient.getAccessToken()) {
      authClient.setAccessToken(token);
    }
  });

  const accessToken = authClient.getAccessToken();
  if (accessToken) {
    graphandClient.setAccessToken(accessToken);
    authClient.sync();
  }
};

export default GraphandPlugin;
