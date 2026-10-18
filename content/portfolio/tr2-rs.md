+++
title = "Tomb Raider II in Bevy"
description = "The PS1 classic ported to native Rust and Bevy, structured as a reusable PS1-style engine."
weight = 1
template = "project.html"

[extra]
group = "personal"
stage = "growing"
crop = "pumpkin"
ai = "post-ai"
tech = ["Rust", "Bevy"]

[[extra.links]]
name = "github"
url = "https://github.com/bombpersons/tr2-rs"
+++

A native Rust / Bevy port of Tomb Raider II (PlayStation). The engine half is
meant to be reusable for other PS1 games; the game itself is rebuilt on top of
it. Nothing reads the disc at build or run time — levels, textures, sound and
music are baked from your own copy of the game into ordinary asset files.

Built with significant LLM assistance: I steer the reverse-engineering and
design, the model does much of the typing.
