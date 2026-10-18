+++
title = "WordySRS"
description = "Turns the foreign language media you read into SRS vocabulary cards, automatically."
weight = 7
template = "project.html"

[extra]
group = "personal"
stage = "fruiting"
crop = "tomato"
ai = "pre-ai"
tech = ["Rust", "HTML", "CSS", "JavaScript", "Docker"]

[[extra.links]]
name = "github"
url = "https://github.com/bombpersons/wordy_srs"
+++

The idea was to create something that could ingest all of the foreign language
media that you've been reading with little effort on your part and present you
with SRS cards for learning the vocab present in your reading material.

This came about as I realized how much time it was taking to write up Anki
cards whenever I was reading something. It was taking the joy out of the
actual reading.

This application takes in the entire text of whatever you have been reading,
splits it into sentences and keeps track of the total word frequency. It then
presents you with sentences for each vocab word in the material in its
database, highest frequency first, making sure the sentences it shows have the
fewest 'new' words so that you don't get bogged down in irrelevant low
frequency words.

![WordySRS](/old/wordysrs_screenshot.png)
