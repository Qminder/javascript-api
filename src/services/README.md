Can't rely on socket.onclose, because browser timeout is very long. => Use socket.onclose only for client initiated close events.
For other events use KeepAlive, which is more reliable