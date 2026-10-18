+++
title = "mdx"
description = "An agent-first Mega Drive reverse-engineering toolkit: an emulator built for looking inside games, with a JSON CLI and MCP server."
weight = 3
template = "project.html"

[extra]
group = "personal"
stage = "growing"
crop = "leek"
ai = "post-ai"
tech = ["Rust", "MCP"]

[[extra.links]]
name = "github"
url = "https://github.com/bombpersons/mdx"
+++

A Mega Drive / Genesis emulator that isn't for playing games — it's for
taking them apart. Boot a cartridge for a few seconds, dump every byte of
memory, find which instruction wrote to an address, trace the sound driver,
record music as WAV or VGM, save and restore the whole machine state. Every
command returns JSON that says what it saw, what it left out, and how sure it
is — so scripts and AI agents can dig through a game without guessing.

Accuracy is checked constantly against Genesis Plus GX: when the two
disagree, both get traced instruction by instruction until mdx matches —
including the weird stuff like open-bus reads and crash-happy prototypes.
Started to reconstruct King's Bounty; built with significant LLM assistance.
