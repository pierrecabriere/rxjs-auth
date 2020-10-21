import { BehaviorSubject } from 'rxjs';

interface IAuthOptions {
  fetchToken?,
  fetchUser?,
  isUserLogged?
}

const defaultOptions: IAuthOptions = {
  isUserLogged: data => !!data && Object.keys(data).length > 0
}

class Auth {
  name;
  options;
  loadingSubject = new BehaviorSubject(false);
  loggedSubject = new BehaviorSubject(false);
  userSubject = new BehaviorSubject(null);

  constructor(name: string, options: IAuthOptions) {
    this.name = name;
    this.options = Object.assign({}, defaultOptions, options);

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

  static create(name: string, options: IAuthOptions) {
    return new Auth(name, options);
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
    return this.name ? `rxjs-auth_${ this.name }` : "rxjs-auth";
  }

  getToken() {
    return localStorage.getItem(this.getTokenName());
  }

  setToken(token) {
    localStorage.setItem(this.getTokenName(), token);
    return this;
  }

  deleteToken() {
    localStorage.removeItem(this.getTokenName());
    return this;
  }

  async fetchToken(...args) {
    const token = this.options.fetchToken && await this.options.fetchToken.call(this, ...args);
    this.setToken(token);
    return token;
  }

  async fetchUser(...args) {
    const token = this.getToken();
    return this.options.fetchUser && await this.options.fetchUser.call(this, token, ...args);
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

export default Auth;
