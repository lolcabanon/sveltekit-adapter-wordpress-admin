<?php

if (!class_exists('Svelte_Plugin')):
    class Svelte_Plugin
    {

        private string $page_title = 'PAGE_TITLE';
        private string $menu_title = 'MENU_TITLE';
        private string $capability = 'CAPABILITY';
        private string $menu_slug = 'MENU_SLUG';
        private string $menu_icon = 'MENU_ICON';

        public function __construct()
        {
            $this->init_actions();
        }

        public function init_actions()
        {
            add_action('admin_enqueue_scripts', [$this, 'svelte_scripts']);
            add_action('admin_menu', [$this, 'my_admin_menu']);
        }

        public function my_admin_menu()
        {
            add_menu_page(
                $this->page_title,
                $this->menu_title,
                $this->capability,
                $this->menu_slug,
                [$this, 'svelte_plugin_callback'], // callback function
                $this->menu_icon, //'dashicons-tickets', //dashboard icon
                6 // position
            );
        }

        public function svelte_scripts($hook)
        {
            if ('toplevel_page_svelte-plugin-in-admin' != $hook)
                return;

            ENQUEUE_SCRIPTS

            FILTER_TYPE_MODULE

            ENQUEUE_STYLES
        }

        public function set_version()
        {
            $date = new DateTime();
            return $date->getTimestamp();
        }

        public function svelte_plugin_callback()
        {

            include('svelte_kit_admin_body.html');
        }
    }

    $svelte_plugin = new Svelte_Plugin();
// add_action( 'plugins_loaded', array( 'Svelte_Plugin', 'init_actions' ) );

endif;
