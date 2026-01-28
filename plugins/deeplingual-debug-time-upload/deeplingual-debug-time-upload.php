<?php
/**
 * Plugin Name: DeepLingual Debug Time & Upload Dir
 */

add_action('rest_api_init', function () {
  register_rest_route('deeplingual/v1', '/debug-time-upload', [
    'methods'  => 'GET',
    'callback' => function () {
      $u = wp_upload_dir();
      return [
        'php_date' => date('Y-m-d H:i:s'),
        'php_utc'  => gmdate('Y-m-d H:i:s'),
        'wp_timezone' => wp_timezone_string(),
        'wp_time_local' => current_time('mysql'),
        'wp_time_gmt'   => current_time('mysql', true),
        'upload_basedir' => $u['basedir'],
        'upload_baseurl' => $u['baseurl'],
        'upload_subdir'  => $u['subdir'],
        'upload_path'    => $u['path'],
        'upload_url'     => $u['url'],
        'rest_request'   => (defined('REST_REQUEST') && REST_REQUEST) ? true : false,
      ];
    },
    'permission_callback' => '__return_true',
  ]);
});
