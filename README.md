# sveltekit-adapter-wordpress-admin (SKAWA)

[Adapter](https://kit.svelte.dev/docs#adapters) for SvelteKit which turns your app into a wordpress plugin admin interface.

## Usage

Install with `npm i -D sveltekit-adapter-wordpress-admin`, setup the adapter in `svelte.config.js`.

### Example `svelte.config.js`

Note: It's likely you will need to set custom base paths for Wordpress.

```js
import adapter from 'sveltekit-adapter-wordpress-admin';

import { sveltePreprocess } from 'svelte-preprocess';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: [sveltePreprocess(), vitePreprocess()],

    kit: {
        // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
        // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
        // See https://kit.svelte.dev/docs/adapters for more information about adapters.
        adapter: adapter({
            pages: 'build',
            assets: 'build',
            fallback: null,
            indexPath: 'index.php',
            shadow: false,
            menu: {
                page_title: 'Svelte in Admin!',
                menu_title: 'Svelte in Admin!',
                icon: 'dashicons-generic',
                slug: 'svelte-in-admin'
            },
            prefix: 'skawa_svelte_in_admin',
            renderHead: (head) =>
                [...head.querySelectorAll(`link[rel="modulepreload"]`)]
                    .map((element) => element.outerHTML)
                    .join(''),
            renderBody: (body) => body.innerHTML
        }),

        embedded: true
    }
};

const host = 'https://example.com';

// handle wordpress url structure
if (process.env.NODE_ENV === 'production') {
    const base = '/wp-content/plugins/my-wp-plugin/admin/build';
    config.kit.paths = {
        base,
        assets: host + base
    };
}

export default config;
```

### Example `index.php`

Note: You can choose the path by setting `indexPath` in the adapter config.

```php
<!-- index.php -->
<?php
/**
 * Plugin Name: My Shortcode
 */

include plugin_dir_path( __FILE__ ) . 'svelte_kit_shortcode.php';
?>
```

## Attributions

This adapter was heavily inspired by [sveltekit-adapter-wordpress-shortcode](https://github.com/tomatrow/sveltekit-adapter-wordpress-shortcode) by **@tomatrow**.

WordPress plugins bindings took inspirations from [this old repo](https://github.com/Ebeldev/svelte-wordpress-plugin) by **@Ebeldev**.

<!--
### Passing attributes and content

Both are inserted right before the svelte kit body.

```html
[my-shortcode attribute-a attribute-b attribute-c]
<a href="/">Home</a>
[/my-shortcode]
```

becomes

```html
<script id="my-shortcode-attributes" type="application/json">
	["attribute-a", "attribute-b", "attribute-c"]
</script>
<template id="my-shortcode-content">
	<a href="/">Home</a>
</template>
<!-- svelte kit body stuff -_>
```
-->

<!--
## Style Isolation

### (1) Shadow dom

Setting the `shadow` option to true puts the head and body data under one shadow dom.

### or (2) Postcss

The following configuration of `postcss` plugins should provide enough isolation from Wordpress styles.

Note that `postcss-autoreset` is using the fork at `tomatrow/postcss-autoreset`.

```js
const autoprefixer = require("autoprefixer")
const cssnano = require("cssnano")
const safeImportant = require("postcss-safe-important")
const prefixer = require("postcss-prefix-selector")
const initial = require("postcss-initial")
const autoReset = require("postcss-autoreset")

const mode = process.env.NODE_ENV
const dev = mode === "development"

const config = {
	plugins: [
		autoReset({ reset: "revert" }),
		initial(),
		prefixer({
			prefix: "#svelte",
			transform(prefix, selector, prefixedSelector) {
				return ["html", "body"].includes(selector) ? `${selector} ${prefix}` : prefixedSelector
			}
		}),
		autoprefixer(),
		safeImportant(),
		!dev &&
			cssnano({
				preset: "default"
			})
	]
}

module.exports = config
```
-->

## License

[MIT](LICENSE)
