+++
title = "Knife and Fork"
description = "An asymmetrical co-op game: one player is a knife, the other a fork, and the food fights back."
weight = 11
template = "project.html"

[extra]
group = "university"
stage = "harvested"
crop = "leek"
ai = "pre-ai"
tech = ["C#", "XNA"]
youtube = "tjmwAP_SQGw"

[[extra.links]]
name = "github"
url = "https://github.com/bombpersons/KnifeAndFork"
+++

A game made for the final module for the first year of university. Our design
goal was asymmetrical gameplay.

One player plays as a knife and the other as a fork. Their goal is to work
together to collect required pieces of food to the dinner plate, although it
won't be easy as this food fights back.

Features a component based enemy design that allows them to be cut up into
pieces and their functionality breaks up appropriately. Cut off their wings
and the part without the wings will fall, cut off their fuse and the part
without won't explode, etc.
