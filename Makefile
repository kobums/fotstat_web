tag=latest

.PHONY: all run build test lint docker dockerrun push clean

all: run

run:
	npm run dev

build:
	npm run build

test:
	npx vitest run

lint:
	npm run lint

docker:
	docker buildx build --platform linux/amd64 -t kobums/fotstat_web:$(tag) --load .

dockerrun:
	docker rm -f fotstat_web 2>/dev/null || true
	docker run --platform linux/amd64 -d --name="fotstat_web" -p 9009:9009 kobums/fotstat_web:$(tag)

push:
	docker buildx build --platform linux/amd64 -t kobums/fotstat_web:$(tag) --push .

clean:
	rm -rf dist
