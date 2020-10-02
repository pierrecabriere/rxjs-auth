# rxjs-auth

Simple auth-manager based on rxjs


--

## Usage

### Create manager

```js
import RxjsAuth from "rxjs-auth";

const authmanager = RxjsAuth.create("myProjectIdentifier", {
  fetchToken: (credentials) => axios.post("/give-me-my-token", credentials).then(res => res.data),
  fetchUser: (token) => axios.post("/who-am-i", { headers: { "Authorization": "Bearer " + token } }).then(res => res.data),
  // optional
  isUserLogged: (resFromFetchUser) => !!resFromFetchUser
});

export { authmanager };
```

### Enjoy !

First, link token to your requests with `getToken()`

```js
import { authmanager } from "./path/to/manager";

axios.interceptors.request.use(function(config) {
  const token = authmanager.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

Then, login with `login()`

```js
import { authmanager } from "./path/to/manager";

console.log(authmanager.logged); // false
console.log(authmanager.user); // null
console.log(authmanager.loading); // false, true while authmanager is logging
await authmanager.login(credentials);
console.log(authmanager.logged); // true
console.log(authmanager.user); // ...
```

### Subscribe

```js
import { authmanager } from "./path/to/manager";

authmanager.loadingSubject.subscribe(_loading => console.log("loading: " + _loading));
authmanager.loggedSubject.subscribe(_logged => console.log("logged: " + _logged));
authmanager.userSubject.subscribe(_user => console.log("user: " + _user));
```

### Sync at startup

```js
import { authmanager } from "./path/to/manager";

// Fetch the user from the previously stored token
authmanager.sync();
```

### Logout

```js
import { authmanager } from "./path/to/manager";

// Fetch the user from the previously stored token
authmanager.logout();
```
