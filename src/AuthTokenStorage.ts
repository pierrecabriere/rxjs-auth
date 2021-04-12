import Cookies from 'universal-cookie';

interface AuthTokenStorageImpl {
  get: Function;
  set: Function;
  del: Function;
}

class AuthTokenStorage implements AuthTokenStorageImpl {
  get;
  set;
  del;

  constructor({ get, set, del }) {
    Object.assign(this, { get, set, del });
  }

  static default = new AuthTokenStorage({
    get: (tokenName: string) => localStorage.getItem(tokenName),
    set: (token: string, tokenName: string) => localStorage.setItem(tokenName, token),
    del: (tokenName: string) => localStorage.removeItem(tokenName),
  })

  static cookie = new AuthTokenStorage({
    get: (tokenName: string, cookieStr?: string) => new Cookies(cookieStr).get(tokenName),
    set: (token: string, tokenName: string) => new Cookies().set(tokenName, token),
    del: (tokenName: string) => new Cookies().remove(tokenName),
  })
}

export default AuthTokenStorage;
