# leo legacy
> [!WARNING]
> This version of leo is discontinued and may stop functioning soon. A few additional commits have been made to re-enable functionality on older devices & browsers.

Meo Experimental with plugins re-enabled :)

## enhancements over standard meo
- 🧪 meo experimental codebase
- 🧩 leo plugins beta (currently only has install sources; install from url, plugin repositories and plugin manifests^ coming soon)
- 💻 leo.js library for easier plugin creation
- 🏞️ image uploads powered by leo images proxy + imgbb
- 🔧 fixed general settings

## planned features
- additional settings (for plugins and possibly custom css)
- install from url, plugin repositiories and plugin manifests^ for leo plugins beta

^ maybe

## leo.js documentation
all leo.js functions can be used with leo.(function).(action)

### plugins
interface with leo plugins beta via leo.plugins.(action)

#### enable
enable a plugin

```javascript
leo.plugins.enable('Plugin Name');
```
#### disable
disable a plugin

```javascript
leo.plugins.disable('Plugin Name');
```

#### list
list all plugins. returns a json array of all plugins in the format:
```json
[
  {
    "name": "Plugin 1",
    "creator": "Bob",
    "description": "Delete meower account on keypress",
    "source": "Leo Plugins",
    "script": "plugins/die.js"
  },
  {
    "name": "Plugin 2",
    "creator": "Alice",
    "description": "Share IP address with everyone on the page",
    "source": "Leo Plugins",
    "script": "plugins/ip.js"
  },
  {
    "name": "Plugin 3",
    "creator": "Frank",
    "description": "Escape the matrix",
    "source": "Leo Plugins",
    "script": "plugins/neo.js"
  }
]
```

```javascript
leo.plugins.list();
```

### session
interface with leo session via leo.session.(action)

#### reload
reload the page

```javascript
leo.session.reload();
```

#### reset
clear all meo settings and log out.

> [!CAUTION]
> This action is destructive! Please ask user for confirmation before calling this function.

```javascript
leo.session.reset();
```

### meower
interface with meower via leo.meower.(function)

#### logout
log out of meower

```javascript
leo.meower.logout();
```

#### login
log in to meower

```javascript
leo.meower.login('username', 'password');
```

#### post
post a message to meower as currently signed in user

```javascript
leo.meower.post('message');
```

#### getusername
get the username of the currently signed in user

```javascript
leo.meower.getusername();
```

