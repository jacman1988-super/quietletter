.PHONY: run build test
PYTHON ?= python3
build:
	docker build -t quietletter:local .
run:
	$(PYTHON) src/setup-model.py
	$(MAKE) build
	docker run --rm --init --cap-drop=ALL --security-opt=no-new-privileges --pids-limit=128 --read-only --tmpfs /tmp:rw,size=64m -p 127.0.0.1:8830:8830 -v "$(CURDIR)/.local-ai:/models:ro" quietletter:local
test:
	node --test src/core.test.mjs src/server.test.mjs
