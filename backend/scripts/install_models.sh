#!/bin/bash

set -e

docker compose up -d ollama

docker compose exec ollama ollama pull qwen3-embedding:0.6b