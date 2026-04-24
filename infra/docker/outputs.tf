output "postgres_connection_string" {
  value     = "postgresql://${var.postgres_user}:${var.postgres_password}@localhost:${var.postgres_port}/${var.postgres_db_name}"
  sensitive = true
}

output "redis_url" {
  value = "redis://localhost:${var.redis_port}"
}

output "redis_insight_url" {
  value = "http://localhost:${var.redis_insight_port}"
}

output "pgadmin_url" {
  value = "http://localhost:${var.pgadmin_port}"
}
