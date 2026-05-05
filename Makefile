RUBY   := /Users/ek/.rbenv/versions/3.3.6/bin/ruby
BUNDLE := /Users/ek/.rbenv/versions/3.3.6/bin/bundle
RAILS  := bin/rails
NPM    := npm

.PHONY: help setup install build dev server lint clean

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "  setup    Install all Ruby + Node dependencies"
	@echo "  install  Same as setup"
	@echo "  build    Build JS/CSS bundle once (production)"
	@echo "  dev      Start Rails server + esbuild watcher"
	@echo "  server   Start Rails server only (port 3000)"
	@echo "  lint     Run Rubocop"
	@echo "  clean    Remove compiled assets"

setup install:
	$(BUNDLE) install
	$(NPM) install

build:
	$(NPM) run build

dev:
	@command -v foreman >/dev/null 2>&1 || $(RUBY) -S gem install foreman --no-document
	foreman start -f Procfile.dev

server:
	$(RAILS) server -p 3000

lint:
	$(BUNDLE) exec rubocop

clean:
	rm -f app/assets/builds/application.js \
	      app/assets/builds/application.js.map \
	      app/assets/builds/application.css \
	      app/assets/builds/application.css.map
