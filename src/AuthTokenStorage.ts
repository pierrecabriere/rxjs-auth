import Cookies from "universal-cookie";

interface AuthTokenStorageImpl {
  get: (tokenName: string) => void;
  set: (token: string, tokenName: string) => void;
  del: (tokenName: string) => void;
}

interface AuthTokenStorageCookieConfigImpl {
  expires?: Date;
  get?: any;
  set?: any;
  remove?: any;
}

const memoryStorage = {};

class AuthTokenStorage implements AuthTokenStorageImpl {
  get;
  set;
  del;

  constructor({ get, set, del }) {
    Object.assign(this, { get, set, del });
  }

  static localStorage = new AuthTokenStorage({
    get: (tokenName: string) => localStorage.getItem(tokenName),
    set: (token: string, tokenName: string) => localStorage.setItem(tokenName, token),
    del: (tokenName: string) => localStorage.removeItem(tokenName),
  });

  static memory = new AuthTokenStorage({
    get: (tokenName: string) => memoryStorage[tokenName],
    set: (token: string, tokenName: string) => (memoryStorage[tokenName] = token),
    del: (tokenName: string) => delete memoryStorage[tokenName],
  });

  static cookie = new AuthTokenStorage({
    get: (tokenName: string, cookieStr?: string) => new Cookies(cookieStr).get(tokenName),
    set: (token: string, tokenName: string) => new Cookies().set(tokenName, token),
    del: (tokenName: string) => new Cookies().remove(tokenName),
  });

  static default = AuthTokenStorage.memory;

  static cookieWithConfig = (config: AuthTokenStorageCookieConfigImpl = {}) => {
    const getOpts = config.get || {};
    const setOpts = config.set || {};
    const removeOpts = config.remove || {};

    setOpts.expires = setOpts.expires ?? config.expires;

    return new AuthTokenStorage({
      get: (tokenName: string, cookieStr?: string) => new Cookies(cookieStr).get(tokenName, getOpts),
      set: (token: string, tokenName: string) => new Cookies().set(tokenName, token, setOpts),
      del: (tokenName: string) => new Cookies().remove(tokenName, removeOpts),
    });
  };
}

export default AuthTokenStorage;
