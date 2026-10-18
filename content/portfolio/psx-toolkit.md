+++
title = "psx"
description = "An agent-first PlayStation reverse-engineering toolkit: emulator backends, Ghidra integration, MCP tools and a Bevy PS1-look game template."
weight = 2
template = "project.html"

[extra]
group = "personal"
stage = "growing"
crop = "carrot"
ai = "post-ai"
tech = ["Rust", "Bevy", "MCP"]

[[extra.links]]
name = "github"
url = "https://github.com/bombpersons/psx"
+++

A PlayStation reverse-engineering toolkit built to be driven by AI agents as
much as by people. It hands an agent an emulator it can interrogate (memory
searches, watches, input replay, frame captures), disc and EXE tools, Ghidra
decompilation on tap, PsyQ symbols, and a Bevy game template with the PS1
look — all as MCP tools that answer in tidy JSON.

Agent-first by design, and largely built with LLM assistance too.
