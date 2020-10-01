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

```js
import { authmanager } from "./path/to/manager";

console.log(authmanager.logged); // false
console.log(authmanager.user); // null
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
