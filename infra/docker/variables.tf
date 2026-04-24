variable "project_name" {
  description = "Project name used for grouping in Docker Desktop"
  type        = string
  default     = "flash-sale-system"
}

# --- PostgreSQL Variables ---

variable "postgres_image_tag" {
  description = "PostgreSQL image tag from Docker Hub"
  type        = string
  default     = "17-alpine"
}

variable "postgres_user" {
  description = "PostgreSQL admin username"
  type        = string
  default     = "admin"
}

variable "postgres_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
}

variable "postgres_db_name" {
  description = "Name of the initial database"
  type        = string
  default     = "flash_sale_db"
}

variable "postgres_port" {
  type    = number
  default = 5432
}

variable "postgres_volume_name" {
  type    = string
  default = "flash-sale-db-data"
}

variable "pgadmin_port" {
  type    = number
  default = 5050
}

variable "pgadmin_email" {
  type = string
}

variable "pgadmin_password" {
  type      = string
  sensitive = true
}

variable "pgadmin_volume_name" {
  type    = string
  default = "flash-sale-pgadmin-data"
}

# --- Redis Variables ---

variable "redis_image_tag" {
  description = "Redis image tag from Docker Hub"
  type        = string
  default     = "8.0-alpine"
}

variable "redis_port" {
  type    = number
  default = 6379
}

variable "redis_password" {
  description = "Redis password"
  type        = string
  sensitive   = true
}

variable "redis_volume_name" {
  type    = string
  default = "flash-sale-redis-data"
}

variable "redis_insight_port" {
  description = "Port for Redis Insight Web UI"
  type        = number
  default     = 8001
}


