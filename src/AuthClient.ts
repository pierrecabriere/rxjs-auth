import { BehaviorSubject } from "rxjs";

import AuthTokenStorage from "./AuthTokenStorage";
import RxjsAuthGraphandPlugin, { GraphandPluginOpts } from "./GraphandPlugin";

interface AuthClientOptions {
  fetchUser?;
  isUserLogged?;
  tokenStorage?;
  login?;
  getAccessToken?;
  getRefreshToken?;
  refreshToken?;
}

interface AuthClientImpl {
  name: string;
  options: AuthClientOptions;
  loadingSubject: BehaviorSubject<boolean>;
  loggedSubject: BehaviorSubject<boolean>;
  userSubject: BehaviorSubject<any>;
}

const defaultOptions: AuthClientOptions = {
  isUserLogged: (data) => !!data && Object.keys(data).length > 0,
  tokenStorage: AuthTokenStorage.default,
  getAccessToken: (data) => data,
  getRefreshToken: () => null,
};

class AuthClient implements AuthClientImpl {
  name: string;
  options: AuthClientOptions;
  loadingSubject: BehaviorSubject<boolean>;
  loggedSubject: BehaviorSubject<boolean>;
  userSubject: BehaviorSubject<any>;

  constructor(name: string, options: AuthClientOptions) {
    this.name = name;
    this.options = Object.assign({}, defaultOptions, options);

    this.loadingSubject = new BehaviorSubject(false);
    this.loggedSubject = new BehaviorSubject(false);
    this.userSubject = new BehaviorSubject(null);

    if (!(this.options.tokenStorage instanceof AuthTokenStorage)) {
      throw new Error("Please provide a valid tokenStorage instance");
    }

    // bind this
    this.getTokenName = this.getTokenName.bind(this);
    this.getToken = this.getToken.bind(this);
    this.setToken = this.setToken.bind(this);
    this.deleteToken = this.deleteToken.bind(this);
    this.deleteAccessToken = this.deleteAccessToken.bind(this);
    this.deleteRefreshToken = this.deleteRefreshToken.bind(this);
    this.getAccessToken = this.getAccessToken.bind(this);
    this.getRefreshToken = this.getRefreshToken.bind(this);
    this.setAccessToken = this.setAccessToken.bind(this);
    this.setRefreshToken = this.setRefreshToken.bind(this);
    this.fetchUser = this.fetchUser.bind(this);
    this.login = this.login.bind(this);
    this.sync = this.sync.bind(this);
    this.logout = this.logout.bind(this);
  }

  static create(name: string, options: AuthClientOptions) {
    return new AuthClient(name, options);
  }

  get loading() {
    return this.loadingSubject.getValue();
  }

  get logged() {
    return this.loggedSubject.getValue();
  }

  get user() {
    return this.userSubject.getValue();
  }

  getTokenName(suffix = "access-token") {
    const name = this.name ? `rxjs-auth-${this.name}` : "rxjs-auth";
    return name + `-${suffix}`;
  }

  getToken(suffix?, ...args) {
    const tokenName = this.getTokenName(suffix);
    return this.options.tokenStorage.get(tokenName, ...args);
  }

  setToken(token, suffix?, ...args) {
    const tokenName = this.getTokenName(suffix);
    this.options.tokenStorage.set(token, tokenName, ...args);
    return this;
  }

  deleteToken(suffix?, ...args) {
    const tokenName = this.getTokenName(suffix);
    this.options.tokenStorage.del(tokenName, ...args);
    return this;
  }

  deleteAccessToken(...args) {
    return this.deleteToken(undefined, ...args);
  }

  deleteRefreshToken(...args) {
    return this.deleteToken("refresh-token", ...args);
  }

  getAccessToken(...args) {
    return this.getToken(undefined, ...args);
  }

  getRefreshToken(...args) {
    return this.getToken("refresh-token", ...args);
  }

  setAccessToken(token, ...args) {
    if (!token) {
      return this.deleteAccessToken();
    }

    return this.setToken(token, undefined, ...args);
  }

  setRefreshToken(token, ...args) {
    if (!token) {
      return this.deleteRefreshToken();
    }

    return this.setToken(token, "refresh-token", ...args);
  }

  async fetchUser(...args) {
    const token = this.getToken();
    return this.options.fetchUser && (await this.options.fetchUser.call(this, token, ...args));
  }

  async login(...args) {
    this.loadingSubject.next(true);
    try {
      const loginData = await this.options.login?.call(this, ...args);
      const accessToken = this.options.getAccessToken(loginData);
      const refreshToken = this.options.getRefreshToken(loginData);
      this.setAccessToken(accessToken);
      this.setRefreshToken(refreshToken);
      const user = await this.fetchUser();
      const isLogged = await this.options.isUserLogged(user);
      if (isLogged) {
        this.userSubject.next(user);
        this.loggedSubject.next(true);
      }
      this.loadingSubject.next(false);
    } catch (e) {
      this.loadingSubject.next(false);
      throw e;
    }
  }

  async refreshToken(...args) {
    this.loadingSubject.next(true);
    try {
      const refreshData = await this.options.refreshToken?.call(this, ...args);
      const accessToken = this.options.getAccessToken(refreshData);
      const refreshToken = this.options.getRefreshToken(refreshData);
      this.setAccessToken(accessToken);
      this.setRefreshToken(refreshToken);
      const user = await this.fetchUser();
      const isLogged = await this.options.isUserLogged(user);
      if (isLogged) {
        this.userSubject.next(user);
        this.loggedSubject.next(true);
      }
      this.loadingSubject.next(false);
    } catch (e) {
      this.loadingSubject.next(false);
      throw e;
    }
  }

  async sync() {
    this.loadingSubject.next(true);
    try {
      const user = await this.fetchUser();
      const isLogged = await this.options.isUserLogged(user);
      if (isLogged) {
        this.userSubject.next(user);
        this.loggedSubject.next(true);
      }
      this.loadingSubject.next(false);
    } catch (e) {
      this.loadingSubject.next(false);
      throw e;
    }
  }

  logout() {
    this.deleteAccessToken();
    this.deleteRefreshToken();
    this.loggedSubject.next(false);
    this.userSubject.next(null);
    return this;
  }

  generateGraphandPlugin(options: GraphandPluginOpts) {
    RxjsAuthGraphandPlugin.options = Object.assign(options || {}, { authClient: this });
    return RxjsAuthGraphandPlugin;
  }
}

export default AuthClient;
