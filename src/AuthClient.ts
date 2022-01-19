import { BehaviorSubject } from "rxjs";

import AuthTokenStorage from "./AuthTokenStorage";

interface AuthClientOptions {
  fetchToken?;
  fetchUser?;
  isUserLogged?;
  tokenStorage?;
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
    this.fetchToken = this.fetchToken.bind(this);
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

  getTokenName() {
    return this.name ? `rxjs-auth-${this.name}` : "rxjs-auth";
  }

  getToken(...args) {
    const tokenName = this.getTokenName();
    return this.options.tokenStorage.get(tokenName, ...args);
  }

  setToken(token, ...args) {
    const tokenName = this.getTokenName();
    this.options.tokenStorage.set(token, tokenName, ...args);
    return this;
  }

  deleteToken(...args) {
    const tokenName = this.getTokenName();
    this.options.tokenStorage.del(tokenName, ...args);
    return this;
  }

  async fetchToken(...args) {
    const token = this.options.fetchToken && (await this.options.fetchToken.call(this, ...args));
    this.setToken(token);
    return token;
  }

  async fetchUser(...args) {
    const token = this.getToken();
    return this.options.fetchUser && (await this.options.fetchUser.call(this, token, ...args));
  }

  async login(...args) {
    this.loadingSubject.next(true);
    try {
      await this.fetchToken(...args);
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
    this.deleteToken();
    this.loggedSubject.next(false);
    this.userSubject.next(null);
    return this;
  }
}

export default AuthClient;
