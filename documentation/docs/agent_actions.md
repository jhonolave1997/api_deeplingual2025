{
  "openapi": "3.1.0",
  "info": {
    "title": "Pedagogical Output API (Airtable)",
    "description": "API para obtener el último output pedagógico desde Airtable vía Vercel",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://api-deeplingual2025.vercel.app/",
      "description": "API desplegada en Vercel"
    }
  ],
  "paths": {
    "/api/pedagogical-outputs/latest": {
      "get": {
        "operationId": "getLatestPedagogicalOutput",
        "summary": "Obtiene el último output pedagógico guardado",
        "description": "Retorna el JSON más reciente guardado por el GPT Pedagogical desde Airtable",
        "responses": {
          "200": {
            "description": "Último output encontrado",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string"
                        },
                        "documentId": {
                          "type": "string"
                        },
                        "attributes": {
                          "type": "object",
                          "properties": {
                            "run_id": {
                              "type": "string"
                            },
                            "output_json": {
                              "type": "object"
                            },
                            "needs_clarification": {
                              "type": "boolean"
                            },
                            "createdAt": {
                              "type": "string"
                            },
                            "updatedAt": {
                              "type": "string"
                            }
                          }
                        }
                      }
                    },
                    "meta": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "No autorizado - Token inválido"
          },
          "404": {
            "description": "No se encontraron registros"
          }
        },
        "post": {
            "operationId": "publishPedagogicalOutputToWp",
            "summary": "Publica un output pedagógico en WordPress",
            "description": "Usa el Run ID para leer desde Airtable y crea un post en WP usando también la imagen generada por el agente.",
            "parameters": [
            {
                "name": "id",
                "in": "path",
                "required": true,
                "schema": { "type": "string" }
            }
            ],
            "requestBody": {
            "required": true,
            "content": {
                "application/json": {
                "schema": {
                    "type": "object",
                    "properties": {
                    "image_url": {
                        "type": "string",
                        "description": "URL de la imagen generada por OpenAI"
                    },
                    "image_alt": {
                        "type": "string",
                        "description": "Texto alternativo para la imagen"
                    }
                    },
                    "required": ["image_url"]
                }
                }
            }
            },
            "responses": {
            "200": {
                "description": "Post publicado correctamente",
                "content": {
                "application/json": {
                    "schema": {
                    "type": "object",
                    "properties": {
                        "wp_post_id": { "type": "integer" },
                        "wp_post_link": { "type": "string" }
                    }
                    }
                }
                }
            },
            "400": { "description": "Petición inválida" },
            "401": { "description": "No autorizado - Token inválido" }
            },
            "security": [
            { "BearerAuth": [] }
            ]
        }
        "security": [
          {
            "BearerAuth": []
          }
        ]
      }
    },
    "/api/pedagogical-outputs/{id}": {
      "get": {
        "operationId": "getPedagogicalOutputById",
        "summary": "Obtiene un output pedagógico específico por Run ID",
        "description": "Retorna un registro específico de Airtable usando su Run ID (formato: deep-lingual-{timestamp})",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "Run ID del registro en Airtable (formato: deep-lingual-{timestamp}, ej: deep-lingual-1705320000000)",
            "schema": {
              "type": "string",
              "example": "deep-lingual-1705320000000"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Output encontrado",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string"
                        },
                        "documentId": {
                          "type": "string"
                        },
                        "attributes": {
                          "type": "object",
                          "properties": {
                            "run_id": {
                              "type": "string"
                            },
                            "output_json": {
                              "type": "object"
                            },
                            "needs_clarification": {
                              "type": "boolean"
                            },
                            "createdAt": {
                              "type": "string"
                            },
                            "updatedAt": {
                              "type": "string"
                            }
                          }
                        }
                      }
                    },
                    "meta": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "No autorizado - Token inválido"
          },
          "404": {
            "description": "Registro no encontrado"
          }
        },
        "post": {
            "operationId": "publishPedagogicalOutputToWp",
            "summary": "Publica un output pedagógico en WordPress",
            "description": "Usa el Run ID para leer desde Airtable y crea un post en WP usando también la imagen generada por el agente.",
            "parameters": [
            {
                "name": "id",
                "in": "path",
                "required": true,
                "schema": { "type": "string" }
            }
            ],
            "requestBody": {
            "required": true,
            "content": {
                "application/json": {
                "schema": {
                    "type": "object",
                    "properties": {
                    "image_url": {
                        "type": "string",
                        "description": "URL de la imagen generada por OpenAI"
                    },
                    "image_alt": {
                        "type": "string",
                        "description": "Texto alternativo para la imagen"
                    }
                    },
                    "required": ["image_url"]
                }
                }
            }
            },
            "responses": {
            "200": {
                "description": "Post publicado correctamente",
                "content": {
                "application/json": {
                    "schema": {
                    "type": "object",
                    "properties": {
                        "wp_post_id": { "type": "integer" },
                        "wp_post_link": { "type": "string" }
                    }
                    }
                }
                }
            },
            "400": { "description": "Petición inválida" },
            "401": { "description": "No autorizado - Token inválido" }
            },
            "security": [
            { "BearerAuth": [] }
            ]
        }
        "security": [
          {
            "BearerAuth": []
          }
        ]
      }
    }
  },
  "components": {
    "schemas": {},
    "securitySchemes": {
      "BearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  }
}