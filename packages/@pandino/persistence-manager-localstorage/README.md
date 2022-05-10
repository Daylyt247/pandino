# persistence-manager-localstorage

Localstorage implementation of the Pandino Persistence Manager API

## Installation

### Install via adding it to `pandino-manifests`

> Only works, if *@pandino/bundle-installer-dom* is installed!

```html
<script type="pandino-manifests">
  [
    ...,
    "./persistence-manager-localstorage-manifest.json"
  ]
</script>
```

### Install via BundleContext API

E.g.: directly via the Pandino instance.

```typescript
const pandino: Bundle;

// ...

pandino.getBundleContext().installBundle('./persistence-manager-localstorage-manifest.json');
```

## Usage

```javascript
export default class Activator {
  async start(context) {
    this.persistenceManagerReference = context.getServiceReference('@pandino/persistence-manager/PersistenceManager');
    this.persistenceManager = context.getService(this.persistenceManagerReference);

    console.log(this.persistenceManager.exists('test.pid'));

    return Promise.resolve();
  }

  stop(context) {
    context.ungetService(this.persistenceManagerReference);

    return Promise.resolve();
  }
}
```