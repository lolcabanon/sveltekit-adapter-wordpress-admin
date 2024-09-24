import { Adapter } from '@sveltejs/kit';

import type { IconKey } from '@wordpress/components/src/dashicon/types';

export type AdapterOptions = {
  pages: string;
  assets: string;
  fallback: string?;
  indexPath: string;
  menuOptions: MenuOptions;
  shadow: boolean;
  prefix: string;
  renderHead: (head: HTMLHeadElement) => string;
  renderBody: (head: HTMLBodyElement) => string;
};

export type MenuOptions = {
  page_title: string; // $page_title
  menu_title: string; // $menu_title
  capability: 'manage_options'; // $capability
  slug: string; // $menu_slug
  icon: `dashicons-${IconKey}`; //dashboard icon
  position: number; // position,
};

declare function plugin(options?: AdapterOptions): Adapter;

export { plugin };
