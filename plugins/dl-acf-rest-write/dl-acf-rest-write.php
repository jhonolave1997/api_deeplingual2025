<?php
/**
 * Plugin Name: DL ACF REST Write
 * Description: Permite escribir campos ACF vía WP REST (wp/v2) en el CPT "planessemanales" enviando { "acf": { ... } }.
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) exit;

add_action('rest_api_init', function () {

  // Solo para el CPT "planessemanales"
  add_filter('rest_after_insert_planessemanales', 'dl_acf_rest_after_insert', 10, 3);

});

/**
 * Se ejecuta después de crear/actualizar un post vía REST.
 *
 * @param WP_Post         $post
 * @param WP_REST_Request $request
 * @param bool            $creating
 */
function dl_acf_rest_after_insert($post, $request, $creating) {

  // Asegura que ACF esté disponible
  if (!function_exists('update_field')) return;

  // Requiere permisos de edición
  if (!current_user_can('edit_post', $post->ID)) return;

  $acf = $request->get_param('acf');
  if (!is_array($acf) || empty($acf)) return;

  // Whitelist: solo permitimos estos campos (ajústalo si necesitas más)
  $allowed = array(
    'curriculum',
    'momento_de_aprendizaje',
    'elof',
    'dominios_uc',
    'grupo_de_edad',
    'enfoque_pedagojico',
    'enfoque_general',
    'estilo_aprendizaje',
    'tipo_de_actividad',
    'instrucciones',
    'materiales',
    'materiales_reciclables',
    'materiales_copiar',
    'objetivos',
    'pasos',
    'tips',
    'instrucciones_de_evaluacion',
    'criteria',
    'requiere_plantilla',
    'multimedia',
    'multimedia_en',
    'plantilla_es_horizontal',
    'plantilla_en_horizontal',
    'foto',
    'tiempo_en_minutos',
    'dia_especifico',
    'mes',
    'estacion',
    'language',
    'link_de_cancion',
    'link_de_cuento',
    'fijar_esta_actividad',
    'post_original_id',
    'guia',
    'actividades_por_unidad',
    'semanas_a_las_que_pertence',
    'semanas_bloqueadas',
  );

  foreach ($acf as $field_name => $value) {

    if (!in_array($field_name, $allowed, true)) {
      continue;
    }

    // Guarda por nombre de campo (ACF)
    update_field($field_name, $value, $post->ID);
  }

  // Opcional: retorna algo en headers para debug (no rompe)
  // header('X-DL-ACF-WRITE: 1');
}
