browser: src/*.js
	mkdir -p build/
	./node_modules/.bin/browserify \
		--extension .coffee \
		--transform browserify-shim \
		--debug \
		. \
		| ./node_modules/.bin/exorcist build/aac.js.map > build/aac.js

clean:
	rm -rf build/
