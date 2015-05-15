//in
[
    "INIT",
    "GET_CHANGES",
    "touch tmp/1",
    "GET_CHANGES",
    "mkdir tmp/sub",
    "touch tmp/sub/2",
    "GET_CHANGES"
]
//out
{"modified":[],"added":[],"deleted":[]}
{"modified":[],"added":["1"],"deleted":[]}
{"modified":[],"added":["1","sub/"],"deleted":[]}