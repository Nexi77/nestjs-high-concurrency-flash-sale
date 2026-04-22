# Flash Sale System (WIP)

## 🎯 Project Goal

A high-concurrency PoC for handling 10k+ RPS during ticket sales.

## 🏗 Current Architecture

* **NestJS Monorepo** (Workspaces)
* **API Gateway:** Request ingestion & Lua script execution.
* **Order Worker:** Background processing for PostgreSQL persistence.
* **Notification Service:** Real-time updates via SSE.

## 📄 Documentation

* [Architecture Decisions (ADR)](./docs/adr/)
* [System Diagram (C4)](./docs/architecture/flash-sale-c4-container.mmd)

## 🛠 Tech Stack (Confirmed)

* NestJS, ioredis, TypeORM, PostgreSQL, BullMQ.
