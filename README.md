# rxjs-auth

Simple javascript auth-manager based on rxjs

--

## Usage

### Create manager

```ts
import RxjsAuth, { AuthTokenStorage } from "rxjs-auth";

const authmanager = RxjsAuth.create("myProjectIdentifier", {
  login: (credentials) => axios.post("/give-me-my-access-token", credentials).then(res => res.data),
  fetchUser: (token) => axios.post("/who-am-i", { headers: { "Authorization": "Bearer " + token } }).then(res => res.data),
  // optional
  isUserLogged: (resFromFetchUser) => !!resFromFetchUser,
  getAccessToken: (loginData) => loginData.accessToken,
  getRefreshToken: (loginData) => loginData.refreshToken, 
  tokenStorage: AuthTokenStorage.localStorage // default value is memory
});

export { authmanager };
```

### Enjoy !

First, include access token in your requests headers with `getAccessToken()`

```ts
axios.interceptors.request.use(function(config) {
  const accessToken = authmanager.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});
```

Then, login with `login()`

```ts
console.log(authmanager.logged); // false
console.log(authmanager.user); // null
console.log(authmanager.loading); // false, true while authmanager is logging
await authmanager.login(credentials);
console.log(authmanager.logged); // true
console.log(authmanager.user); // ...
```

### Default configuration

```ts
const defaultOptions: AuthClientOptions = {
  isUserLogged: (data) => !!data && Object.keys(data).length > 0,
  tokenStorage: AuthTokenStorage.default,
  getAccessToken: (data) => data,
  getRefreshToken: () => null,
};
```

### Subscribe

```ts
authmanager.loadingSubject.subscribe(_loading => console.log("loading: " + _loading));
authmanager.loggedSubject.subscribe(_logged => console.log("logged: " + _logged));
authmanager.userSubject.subscribe(_user => console.log("user: " + _user));
```

### Sync at startup

```ts
// Fetch the user from the previously stored token
authmanager.sync();
```

### Logout

```ts
authmanager.logout();
```

### Update options

```ts
authmanager.setOptions({
    tokenStorage: AuthTokenStorage.cookie
});
```
