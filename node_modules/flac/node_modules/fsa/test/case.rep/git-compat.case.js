//in
[
    "touch tmp/1",
    "INIT",
    "git init tmp",
    "GET_CHANGES",
    "COMMIT",
    "GET_CHANGES",
    "mkdir tmp/sub",
    "touch tmp/sub/2",
    "git init tmp/sub",
    "GET_CHANGES",
    "COMMIT",
    "GET_CHANGES"
]
//out
{"modified":[],"added":["1"],"deleted":[]}
{"modified":[],"added":[],"deleted":[]}
{"modified":[],"added":["sub/"],"deleted":[]}
{"modified":[],"added":[],"deleted":[]}