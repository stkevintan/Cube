browser: src/*.js
	mkdir -p build/
	./node_modules/.bin/browserify \
		--extension .coffee \
		--transform browserify-shim \
		--debug \
		. \
		| ./node_modules/.bin/exorcist build/mp3.js.map > build/mp3.js

clean:
	rm -rf build/
