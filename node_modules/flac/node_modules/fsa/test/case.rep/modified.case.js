//in
[
    "INIT",
    "GET_CHANGES",
    "touch tmp/1",
    "COMMIT",
    "date > tmp/1",
    "GET_CHANGES",
    "mkdir tmp/sub",
    "touch tmp/sub/2",
    "COMMIT",
    "date > tmp/sub/2",
    "GET_CHANGES"
]
//out
{"modified":[],"added":[],"deleted":[]}
{"modified":["1"],"added":[],"deleted":[]}
{"modified":["sub/2"],"added":[],"deleted":[]}