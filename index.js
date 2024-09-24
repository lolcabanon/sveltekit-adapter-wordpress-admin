import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { JSDOM } from 'jsdom';

const files = fileURLToPath(new URL('./files', import.meta.url).href);

/**
 * @type {import('.').MenuOptions}
 */
const defaultMenuOptions = {
  page_title: 'Svelte in Admin', // $page_title
  menu_title: 'Svelte in Admin', // $menu_title
  capability: 'manage_options', // $capability
  slug: 'svelte-plugin-in-admin', // $menu_slug
  icon: 'dashicons-tickets', //dashboard icon
  position: 6 // position,
};

/**
 * @type {import('.').AdapterOptions}
 */
const defaultAdapterOptions = {
  pages: 'build',
  assets: 'build',
  fallback: null,
  indexPath: 'index.php',
  shadow: false,
  menuOptions: defaultMenuOptions,
  prefix: 'skawa_' + defaultMenuOptions.slug.replace(/[^\w]/g, '_'),
  renderHead: (head) =>
    [...head.querySelectorAll(`link[rel="modulepreload"]`)]
      .map((element) => element.outerHTML)
      .join(''),
  renderBody: (body) => body.innerHTML
};

/**
 * @type {(adapterOptions: Partial<import('.').AdapterOptions>) => import('@sveltejs/kit').Adapter}
 */
export default function (adapterOptions) {
  // apply default menu values
  const wpMenuOptions = {
    ...defaultMenuOptions,
    ...adapterOptions.menuOptions
  };

  const { assets, pages, indexPath, renderHead, renderBody } = {
    ...defaultAdapterOptions,
    ...adapterOptions
  };

  /** @type {import('@sveltejs/kit').Adapter} */
  const adapter = {
    name: 'sveltekit-adapter-wordpress-admin',

    async adapt(/** @type {import('@sveltejs/kit').Builder}*/ builder) {
      if (!builder.config.kit.paths.base)
        builder.log.warn(
          'You should set config.kit.paths.base to something like `/wp-content/plugins/my-admin-plugin`'
        );

      if (!builder.config.kit.paths.assets)
        builder.log.warn(
          'You should set config.kit.paths.assets to something like `https://example.com/wp-content/plugins/my-admin-plugin`'
        );

      builder.rimraf(assets);
      builder.rimraf(pages);

      const client = builder.writeClient(assets);
      builder.writePrerendered(pages);
      const pageFiles = [...builder.prerendered.pages.values()].map(
        (page) => page.file
      );
      for (const file of pageFiles)
        if (file !== 'index.html') builder.rimraf(resolve(pages, file));

      if (!pageFiles.includes('index.html')) {
        builder.log.error(
          `sveltekit-adapter-wordpress-admin: root route must be prerendered (unless using the 'fallback' option — see https://github.com/sveltejs/kit/tree/master/packages/adapter-static#spa-mode). Try adding \`export const prerender = true\` to your root layout.js — see https://kit.svelte.dev/docs/page-options#prerender for more details`
        );

        throw new Error('Encountered non rendered root route');
      }

      const phpEnqueueScriptTemplate = `wp_enqueue_script('HANDLE', plugins_url('/_app/immutable/entry/FILE.JS', __FILE__), [], $this->set_version(), true);
  `;

      const phpFilterTypeModuleTemplate = `
function sveltekit_load_module( $tag, $handle ) {
  if ( CONDITION ) {
    $tag = str_replace( '<script ', '<script type="module" ', $tag );
  }

  return $tag;
}
add_filter( 'script_loader_tag', 'sveltekit_load_module', 10, 2 );
`;

      const phpEnqueueStyleTemplate = `wp_enqueue_style('HANDLE', plugins_url('/_app/immutable/assets/FILE.CSS', __FILE__), [], $this->set_version(), true);
  `;

      const manifest = builder.generateManifest({
        relativePath: './'
      });

      const clientManifest = eval(manifest)._.client;

      const CLIENT_SCRIPTS = [clientManifest.start, clientManifest.app].map(
        (asset) => {
          const segments = asset.split('/');
          const name = segments[segments.length - 1];

          return [`sveltekit_admin_${name}`, name];
        }
      );

      const ENQUEUE_SCRIPTS = CLIENT_SCRIPTS.map(([handle, name]) =>
        phpEnqueueScriptTemplate
          .replace('HANDLE', handle)
          .replace('FILE.JS', name)
      ).join('\n');

      const FILTER_TYPE_MODULE = phpFilterTypeModuleTemplate.replace(
        'CONDITION',
        CLIENT_SCRIPTS.map(
          ([handle, name]) => ` '${handle}' === $handle `
        ).join('|')
      );

      const ENQUEUE_STYLES = client
        .filter((a) => a.endsWith('.css'))
        .map((asset) => {
          const segments = asset.split('/');
          const name = segments[segments.length - 1];

          return phpEnqueueStyleTemplate
            .replace('HANDLE', `sveltekit_admin_${name}`)
            .replace('FILE.CSS', name);
        })
        .join('\n');

      // copy php files
      builder.copy(indexPath, resolve(pages, 'index.php'));
      builder.copy(files, pages, {
        replace: {
          PAGE_TITLE: wpMenuOptions.page_title,
          MENU_TITLE: wpMenuOptions.menu_title,
          CAPABILITY: wpMenuOptions.capability,
          MENU_SLUG: wpMenuOptions.slug,
          MENU_ICON: wpMenuOptions.icon,
          ENQUEUE_SCRIPTS,
          FILTER_TYPE_MODULE,
          ENQUEUE_STYLES
        }
      });

      //   builder.generateManifest({
      //     relativePath: '.'
      //   });

      // read, remove, and transform index.html
      const indexHtmlPath = resolve(pages, 'index.html');
      const dom = new JSDOM(readFileSync(indexHtmlPath, 'utf8'));
      builder.rimraf(indexHtmlPath);
      writeFileSync(
        resolve(pages, 'svelte_kit_admin_head.html'),
        renderHead(dom.window.document.head)
      );
      writeFileSync(
        resolve(pages, 'svelte_kit_admin_body.html'),
        renderBody(/** @type {HTMLBodyElement} */ (dom.window.document.body))
      );

      if (pages === assets) builder.log(`Wrote site to "${pages}"`);
      else builder.log(`Wrote pages to "${pages}" and assets to "${assets}"`);
    }
  };

  return adapter;
}
