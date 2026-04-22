resource "docker_network" "flash_sale_network" {
  name = "flash-sale-network"
}

# --- Volumes Definition ---

resource "docker_volume" "postgres_data" {
  name = var.postgres_volume_name
  labels {
    label = "com.docker.compose.project"
    value = var.project_name
  }
}

resource "docker_volume" "redis_data" {
  name = var.redis_volume_name
  labels {
    label = "com.docker.compose.project"
    value = var.project_name
  }
}

resource "docker_volume" "pgadmin_data" {
  name = var.pgadmin_volume_name
  labels {
    label = "com.docker.compose.project"
    value = var.project_name
  }
}

# --- PostgreSQL ---

resource "docker_image" "postgres" {
  name         = "postgres:${var.postgres_image_tag}"
  keep_locally = true
}

resource "docker_container" "postgres" {
  name  = "flash-sale-db"
  image = docker_image.postgres.image_id

  networks_advanced {
    name = docker_network.flash_sale_network.name
  }

  labels {
    label = "com.docker.compose.project"
    value = var.project_name
  }

  ports {
    internal = 5432
    external = var.postgres_port
  }

  env = [
    "POSTGRES_USER=${var.postgres_user}",
    "POSTGRES_PASSWORD=${var.postgres_password}",
    "POSTGRES_DB=${var.postgres_db_name}"
  ]

  volumes {
    volume_name    = docker_volume.postgres_data.name
    container_path = "/var/lib/postgresql/data"
  }

  healthcheck {
    test     = ["CMD-SHELL", "pg_isready -U ${var.postgres_user} -d ${var.postgres_db_name}"]
    interval = "5s"
    timeout  = "5s"
    retries  = 5
  }
}

# --- pgAdmin ---

resource "docker_image" "pgadmin" {
  name         = "dpage/pgadmin4:latest"
  keep_locally = true
}

resource "docker_container" "pgadmin" {
  name  = "flash-sale-pgadmin"
  image = docker_image.pgadmin.image_id

  networks_advanced {
    name = docker_network.flash_sale_network.name
  }

  labels {
    label = "com.docker.compose.project"
    value = var.project_name
  }

  ports {
    internal = 80
    external = var.pgadmin_port
  }

  env = [
    "PGADMIN_DEFAULT_EMAIL=${var.pgadmin_email}",
    "PGADMIN_DEFAULT_PASSWORD=${var.pgadmin_password}"
  ]

  volumes {
    volume_name    = docker_volume.pgadmin_data.name
    container_path = "/var/lib/pgadmin"
  }

  depends_on = [docker_container.postgres]
}

# --- Redis ---

resource "docker_image" "redis" {
  name         = "redis:${var.redis_image_tag}"
  keep_locally = true
}

resource "docker_container" "redis" {
  name  = "flash-sale-redis"
  image = docker_image.redis.image_id

  networks_advanced {
    name = docker_network.flash_sale_network.name
  }

  labels {
    label = "com.docker.compose.project"
    value = var.project_name
  }

  command = ["redis-server", "--requirepass", var.redis_password, "--save", "60", "1", "--appendonly", "yes"]

  ports {
    internal = 6379
    external = var.redis_port
  }

  volumes {
    volume_name    = docker_volume.redis_data.name
    container_path = "/data"
  }

  healthcheck {
    test     = ["CMD", "redis-cli", "-a", var.redis_password, "ping"]
    interval = "5s"
    timeout  = "3s"
    retries  = 5
  }
}

# --- Redis Insight ---

resource "docker_image" "redis_insight" {
  name         = "redislabs/redisinsight:latest"
  keep_locally = true
}

resource "docker_container" "redis_insight" {
  name  = "flash-sale-redis-insight"
  image = docker_image.redis_insight.image_id

  networks_advanced {
    name = docker_network.flash_sale_network.name
  }

  labels {
    label = "com.docker.compose.project"
    value = var.project_name
  }

  ports {
    internal = 5540
    external = var.redis_insight_port
  }

  # launch Redis Insight only after Redis is healthy
  depends_on = [
    docker_container.redis
  ]
}
