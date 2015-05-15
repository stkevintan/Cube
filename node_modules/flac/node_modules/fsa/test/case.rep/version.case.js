//in
[
    "INIT",
    "touch tmp/1",
    "GET_VERSION",    
    "COMMIT",
    "GET_VERSION",
    "touch tmp/2",
    "CHECK_VERSION",
    "COMMIT",
    "CHECK_VERSION"
]
//out
same
different