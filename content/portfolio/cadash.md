+++
title = "Cadash (Bevy remake)"
description = "A native Rust / Bevy re-implementation of Taito's Cadash for the Mega Drive, reverse-engineered with mdx."
weight = 4
template = "project.html"

[extra]
group = "personal"
stage = "growing"
crop = "pea"
ai = "post-ai"
tech = ["Rust", "Bevy"]

[[extra.links]]
name = "github"
url = "https://github.com/bombpersons/cadash"
+++

A Bevy remake of Taito's Cadash (Mega Drive). The repo contains no game data:
graphics, level data, text and sound are extracted from your own cartridge by
scripts, and the game's behaviour follows reverse-engineered specifications.

The README says it plainly: the code was written almost entirely by Claude
(Claude Code), which reverse-engineered the cartridge using mdx and checked
its work against the original by comparing emulator frames and RAM. A nice
demonstration of the toolkit-to-game workflow.
