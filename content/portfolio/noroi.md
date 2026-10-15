+++
title = "Noroi"
description = "A modern library for creating ASCII based text games similar to Dwarf Fortress or Rogue."
weight = 3
template = "project.html"

[extra]
group = "personal"
stage = "fruiting"
crop = "pumpkin"
tech = ["C", "C++", "Haskell"]

[[extra.links]]
name = "github"
url = "https://github.com/bombpersons/noroi"

[[extra.links]]
name = "haskell bindings"
url = "https://github.com/bombpersons/noroi-haskell"
+++

A modern library for creating ASCII based text games similar to Dwarf
Fortress, Rogue, etc. It uses a server/client model to separate rendering from
any game logic. The server represents the screen (or the terminal) and the
client represents the game / program.

The library uses libzmq to handle communication between the server and client,
and is capable of interthread (client and server in the same program),
interprocess (client and server being separate programs) and network (client
and server on different computers) communication.

Currently there is only one server, a server written using glfw and opengl 3.0,
although other servers could be easily written by simply accepting the same
communication protocol.

A WIP Haskell binding exists on
[GitHub](https://github.com/bombpersons/noroi-haskell).

![Noroi](/old/noroi_screenshot.png)
