# SPDX-License-Identifier: Apache-2.0
# Network is used at build time only; the application performs only loopback
# inference at runtime. Docker execution is not yet verified on the author host.
FROM node:22.19.0-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends git cmake make g++ ca-certificates && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 --branch b11552 https://github.com/ggml-org/llama.cpp.git /opt/llama
RUN cmake -S /opt/llama -B /opt/llama/build -DCMAKE_BUILD_TYPE=Release -DGGML_NATIVE=OFF -DLLAMA_CURL=OFF -DLLAMA_BUILD_TESTS=OFF -DLLAMA_BUILD_EXAMPLES=OFF -DLLAMA_BUILD_SERVER=ON \
 && cmake --build /opt/llama/build --target llama-server --parallel 2

FROM node:22.19.0-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 && rm -rf /var/lib/apt/lists/*
COPY --from=build /opt/llama/build/bin/ /opt/llama/
COPY --from=build /opt/llama/LICENSE /opt/llama/LICENSE
WORKDIR /app
COPY src/ ./src/
ENV LD_LIBRARY_PATH=/opt/llama QUIETLETTER_RUNTIME=/opt/llama/llama-server QUIETLETTER_MODEL=/models/apertus-v1.5-8b-text-q4_k_m.gguf QUIETLETTER_CONTAINER=1
USER node
EXPOSE 8830
CMD ["node","src/run-local.mjs"]
