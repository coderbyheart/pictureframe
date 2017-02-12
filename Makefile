.DEFAULT_GOAL := help
.PHONY: help clean demo

# JavaScript

build/index.min.js: build/index.js
ifeq "${ENVIRONMENT}" "development"
	cp $< $@
else
	./node_modules/.bin/uglifyjs $< -o $@
endif

build/index.js: src/index.js
	@mkdir -p $(dir $@)
	./node_modules/.bin/browserify $< -t babelify --outfile $@

# Stylesheets

build/index.min.css: build/index.css
ifeq ($(ENVIRONMENT),development)
	cp $< $@
else
	./node_modules/.bin/uglifycss $< > $@
endif

build/index.css: src/index.scss
	@mkdir -p $(dir $@)
	./node_modules/.bin/node-sass $< $@

# Data

build/config.json: package.json
	node -e 'var pjson = require("./package.json"); process.stdout.write(JSON.stringify(Object.assign(pjson.config, {environment: "${ENVIRONMENT}", "version": pjson.version, deployTime: Date.now()}), "\t", 2))' > $@

# HTML

build/index.html: src/index.html build/index.min.js build/config.json build/index.min.css
	@mkdir -p $(dir $@)
	./node_modules/.bin/rheactor-build-views build build/config.json $< $@

# Main

help: ## (default), display the list of make commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

clean:
	rm -rf dist build

demo: build/index.html ## Use demo data
	cp example/pictures.json build
