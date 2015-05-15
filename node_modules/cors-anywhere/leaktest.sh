#!/bin/bash
# step 1a: Start test server
# node ~/node/quick-server/redirect-print.js
# step 1b: webkit devtools frontend
# in ~/lib/node-webkit-devtools/

# step 2: start proxy with debugging
# node server.js

# step 3: refresh devtools frontend in browser
# See README.txt of step 1b

# step 4: Test

if [ $# -eq 0 ] ; then # no args
    echo "Test with redirect"
    for i in {1..100} ; do curl -s 'http://127.0.0.1:8080/http://127.0.0.1:1302/xxx' -H 'Origin: x' -o /dev/null ; done
else
    echo "Test without redirect"
    for i in {1..100} ; do curl -s 'http://127.0.0.1:8080/http://127.0.0.1:1302/' -H 'Origin: x' -o /dev/null ; done
fi

# step 5: Check for leak
