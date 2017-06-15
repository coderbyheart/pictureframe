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

build/config.json: guard-VERSION guard-ENVIRONMENT package.json
	node -e 'var pjson = require("./package.json"); process.stdout.write(JSON.stringify(Object.assign(pjson.config, {environment: "${ENVIRONMENT}", "version": "${VERSION}", deployTime: Date.now(), baseHref: "${BASE_HREF}".length ? "${BASE_HREF}" : pjson.config.baseHref}), "\t", 2))' > $@

# HTML

build/index.html: src/index.html build/index.min.js build/config.json build/index.min.css
	@mkdir -p $(dir $@)
	./node_modules/.bin/rheactor-build-views build build/config.json $< $@

# Deploy

AWS_REGION ?= eu-central-1
S3_CFG := /tmp/.s3cfg-$(AWS_WEBSITE_BUCKET)

deploy: guard-AWS_WEBSITE_BUCKET guard-AWS_ACCESS_KEY_ID guard-AWS_SECRET_ACCESS_KEY guard-VERSION

	# Create s3cmd config
	@echo $(S3_CFG)
	@echo "[default]" > $(S3_CFG)
	@echo "access_key = $(AWS_ACCESS_KEY_ID)" >> $(S3_CFG)
	@echo "secret_key = $(AWS_SECRET_ACCESS_KEY)" >> $(S3_CFG)
	@echo "bucket_location = $(AWS_REGION)" >> $(S3_CFG)

	rm -rf build
	ENVIRONMENT=production make -B build
	rm build/index.js
	rm build/index.css
	s3cmd -c $(S3_CFG) sync ./build/ s3://$(AWS_WEBSITE_BUCKET)/

	# Expires 1 minutes for html files
	s3cmd -c $(S3_CFG) \
		modify --recursive \
		--add-header=Cache-Control:public,max-age=60 \
		--remove-header=Expires \
		--add-header=x-amz-meta-version:$(VERSION) \
		--exclude "*" --include "*.html" --include "*.txt" \
		s3://$(AWS_WEBSITE_BUCKET)/

	# Expires 1 year for everything else
	s3cmd -c $(S3_CFG) \
		modify --recursive \
		--add-header=Cache-Control:public,max-age=31536000 \
		--remove-header=Expires \
		--add-header=x-amz-meta-version:$(VERSION) \
		--exclude "*.html" --exclude "*.txt" \
		s3://$(AWS_WEBSITE_BUCKET)/

# Lambda

AWS_FUNCTION_NAME ?= pictureframe
AWS_ROLE ?= pictureframe

lambda.zip: src/*.js package.json
	rm -f $@
	rm -rf lambda
	./node_modules/.bin/babel src -d lambda
	cp package.json lambda
	cd lambda; npm install --production > /dev/null
	cd lambda; zip -r -q ../$@ ./

deploy-lambda: lambda.zip guard-AWS_ACCOUNT ## Deploy to AWS lambda
	aws lambda create-function \
	--region $(AWS_REGION) \
	--function-name $(AWS_FUNCTION_NAME) \
	--zip-file fileb://$< \
	--role arn:aws:iam::$(AWS_ACCOUNT):role/$(AWS_ROLE) \
	--timeout 50 \
	--handler lambdas.$(AWS_FUNCTION_NAME) \
	--runtime nodejs6.10

update-lambda-function: lambda.zip ## Update the lambda function with new lambda
	aws lambda update-function-code \
	--region $(AWS_REGION) \
	--function-name $(AWS_FUNCTION_NAME) \
	--zip-file fileb://$<

delete-lambda: ## Deploy from AWS lambda
	aws lambda delete-function --region $(AWS_REGION) --function-name $(AWS_FUNCTION_NAME)

update-lambda: ## Update the lambda
	make update-lambda-function

# Helpers

guard-%:
	@ if [ "${${*}}" = "" ]; then \
		echo "Environment variable $* not set"; \
		exit 1; \
	fi

# Main

help: ## (default), display the list of make commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

clean:
	rm -rf dist build lambda

build: build/index.html

demo: build/index.html ## Use demo data
	cp example/pictures.json build
