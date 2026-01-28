<?php
/**
 * Plugin Name: DeepLingual – Force Upload Dir for REST (TEST)
 * Description: Fuerza las subidas REST a una carpeta fija para validar problema de fecha/servidor.
 */

add_filter('upload_dir', function ($dirs) {

  // Solo aplicar a requests REST
  if (!defined('REST_REQUEST') || !REST_REQUEST) {
    return $dirs;
  }

  // Carpeta que SABEMOS que funciona
  $forced_subdir = '/2025/04';

  $dirs['subdir'] = $forced_subdir;
  $dirs['path']   = $dirs['basedir'] . $forced_subdir;
  $dirs['url']    = $dirs['baseurl'] . $forced_subdir;

  return $dirs;
});
