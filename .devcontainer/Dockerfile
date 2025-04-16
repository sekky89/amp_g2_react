FROM debian:stable-slim as mise

RUN apt-get update  \
    && apt-get -y --no-install-recommends install  \
    sudo curl git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ENV MISE_DATA_DIR="/mise"
ENV MISE_CONFIG_DIR="/mise"
ENV MISE_CACHE_DIR="/mise/cache"
ENV MISE_INSTALL_PATH="/usr/local/bin/mise"
ENV PATH="/mise/shims:$PATH"

RUN curl https://mise.run | sh

FROM mise
WORKDIR /workspace
ENV TZ=Asia/Tokyo

RUN mise use -g node@22 bun@1.2 biome@1.9.4 aws-cli jq yq
RUN bun i -g sst orval @redocly/cli
ENV PATH="/root/.bun/bin:$PATH"
