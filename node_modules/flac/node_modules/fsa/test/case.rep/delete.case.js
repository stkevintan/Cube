//in
[
    "touch tmp/1",
    "INIT",
    "COMMIT",
    "rm tmp/1",
    "GET_CHANGES",
    "COMMIT",
    "mkdir tmp/sub",
    "touch tmp/sub/2",
    "touch tmp/sub/3",
    "COMMIT",
    "rm tmp/sub/3",
    "GET_CHANGES",
    "rm -rf tmp/sub",
    "GET_CHANGES"
]
//out
{"modified":[],"added":[],"deleted":["1"]}
{"modified":[],"added":[],"deleted":["sub/3"]}
{"modified":[],"added":[],"deleted":["sub/2","sub/3"]}