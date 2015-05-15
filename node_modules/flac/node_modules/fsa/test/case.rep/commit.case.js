//in
[
    "touch tmp/1",
    "INIT",
    "GET_CHANGES",
    "COMMIT",
    "GET_CHANGES",
    "mkdir tmp/sub",
    "touch tmp/sub/2",
    "GET_CHANGES",
    "COMMIT",
    "GET_CHANGES",
    "touch tmp/sub/3",
    "GET_CHANGES",
    "COMMIT",
    "GET_CHANGES"
]
//out
{"modified":[],"added":["1"],"deleted":[]}
{"modified":[],"added":[],"deleted":[]}
{"modified":[],"added":["sub/"],"deleted":[]}
{"modified":[],"added":[],"deleted":[]}
{"modified":[],"added":["sub/3"],"deleted":[]}
{"modified":[],"added":[],"deleted":[]}