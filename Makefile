.PHONY: init install build test test-watch clean

init:
	npm install
	rm -rf siyuan
	git clone https://github.com/siyuan-note/siyuan.git
	cd siyuan && git checkout v3.1.17

install:
	npm install -g .

build:
	npm run build

test:
	npm test

test-watch:
	npm run test:watch

clean:
	rm -rf dist dist-test node_modules/.cache