---
title: "Reverse engineering the Wi-Fi setup process on HP printers"
description: "A tutorial for breaking into your printer, and a case study of LLM-accelerated analysis"
tags: ['technical', 'agentic-engineering', 'reverse-engineering']
pubDate: '2026-05-03T01:13:36.346Z'
---

This blog post tells the story of how I spent part of a Saturday steering Claude
Sonnet 4.6 to reverse engineer HP's printer app, in order to get a printer to
connect to Wi-Fi without needing a cloud account. This turned out to be an
interesting and fun exercise, with several lessons learned.

The resulting Python script for configuring printers is available at [https://github.com/embeddedt/hp-printer-wifi-setup](https://github.com/embeddedt/hp-printer-wifi-setup),
but please keep the disclaimers in the repo in mind.

## Motivation

I have used an HP LaserJet MFP M28w printer for years, generally over wireless
on a standard Wi-Fi network. Recently the printer stopped connecting to Wi-Fi
at an extremely inconvenient time. The reason for this was not clear, but my
guess would be that some configuration got corrupted.

HP's
[support article](https://support.hp.com/us-en/document/ish_3967769-3956733-16) outlines
the procedure for entering wireless setup mode on many printers. On this model, the
steps are:

1. Press and hold the wireless button.
2. The power button will start flashing; continue holding down the wireless button.
3. The attention (⚠) symbol will start flashing. At this point you can release
the wireless button, and the wireless configuration will be reset.

HP then recommends users use their proprietary app to configure the printer, by
connecting to the `HP-Setup [model]` network it exposes with a phone.
I read [posts](https://h30434.www3.hp.com/t5/Scanning-Faxing-Copying/How-to-use-HPsmart-app-without-creating-an-account/td-p/9585884)
that suggested the app might require an HP account, so I did not
pursue that direction. There is absolutely no reason why a cloud account should
be required to set up a local printer.

HP's documentation then [claims](https://support.hp.com/us-en/document/ish_1780623-1698506-16),
for printers without a touchscreen, that it should be possible to access the embedded web server (EWS)
by connecting to the HP-Setup network with a PC, loading `http://192.168.223.1`
in a browser, and navigating to the wireless setup wizard. This solution sounded
very reasonable, so I tried it.

The printer returned a 403 Forbidden error and I could not find any solution for
it online. One user had [posted about the issue]((https://h30434.www3.hp.com/t5/LaserJet-Printing/HTTP-403-when-accessing-Laserjet-EWS/td-p/9531297)) on HP's support forum, and
received only generic tech support advice in response.

At this point it was quite late at night, and clear that no well-documented
solution for the problem existed. I gave up for the time being and printed what was needed
over USB. (I also attempted to set up wireless through USB, via HPLIP tooling,
but the UI froze and I got nowhere.)

The absurdity of this situation gave me all the reasons I needed to reverse engineer
the printer setup process and build a simple tool to configure it once and for all.
This process would normally be quite time-consuming, but I decided to experiment
with delegating the task to frontier LLMs and seeing how far I could get without
needing to step in and debug myself.

## Workflow

My strategy was to decompile an older version of the HP Smart Android app,
from before 2020, and use it as a reference to identify the correct endpoints
on the printer and build a simple script that could run on any Linux system. I found another [blog post](https://sijisu.eu/posts/writing-hpsimplescan/)
in which the author successfully developed their own scanning tool for a LaserJet
using the older app, so I imagined it would be a good starting point.

The decompilation step was trivial, since it just involves running CLI tools, so I would handle it myself.
Code analysis would be harder given the app was likely partially obfuscated. That step,
and the (relatively straightforward) task of writing the final script would be delegated
to a coding agent.

There were two major requirements/limitations to keep in mind:

- I do not divulge secrets like Wi-Fi credentials to my agent, so the LLM would not be able to test the original app's code with real data.
- I only have one Wi-Fi interface on my PC, so I cannot be connected to the printer and the Internet at the same time.
  This means the agent cannot interactively test the printer endpoints.

Theoretically, these limitations could be worked around with a custom harness
that encrypts secrets and allows the connection to be interrupted during tool
calls, but it would be less fun that way.

Instead, the LLM would have to operate solely based off any specifications I gave it,
and rely on my feedback to know the next direction it should take. In many cases,
requiring this continuous involvement from a human is a safer approach. It allows
the human to recognize when the LLM is veering off course and provide it better
context to continue.

In my situation, however, I am pretty sure the "blindness" led to worse model performance and poorer quality of the resulting code.
I find LLMs get work done faster and make fewer mistakes if they have their own verification tool(s) to use,
even when I am supervising them and providing my own feedback. Without the full
context of the data their code is operating with, they resort to programming defensively
to increase their chance of success, which results in verbose and questionable code.
They then preserve this defensive code in any future refactors as they have no way to know
if it's still needed.

Although the resulting script would be written entirely by the LLM (assuming success), I would
personally still classify this exercise as "agentic engineering" (using the LLM to accelerate
existing work) rather than "vibe coding" (paying no attention to the solution at
all). There is still a lot of thought being put into what context to give the agent,
and how to set it up for success despite the limitations outlined above.

## Models used

For this project I used three models:

- Claude Sonnet 4.6, available via Anthropic's $20/mo Claude Pro plan, running in Claude Code
- Claude Haiku 4.5, same as above
- GPT-5.4 Mini, available for free with a ChatGPT account, running in the FOSS `pi` coding agent

The primary model was Sonnet 4.6, with a very vanilla Claude Code setup. The main
config changes I've made are disabling adaptive thinking and lowering effort to medium.
For personal projects, I generally don't give the model hard enough problems or messy enough
codebases to require high effort. I do, however, ask it questions that nearly always require
some reasoning and not just a direct answer.

Haiku 4.5 was used as a secondary agent (both by me, and as a subagent invoked by Sonnet's choice)
to do bulk research on the code and write summaries for handoff to Sonnet. Because
Haiku is a cheap and smaller model, it tends to make mistakes on open-ended tasks,
even when its output is directionally correct.

I used GPT-5.4 Mini once at the beginning, as an alternative to Google searching
for APK decompilation commands, but still included it in the list for completeness.
If I had been able to use my Claude subscription with `pi`, I would consider
using GPT-5.4 Mini in place of Haiku 4.5.

## The process

This section is a bit long, but I wanted to outline my process in case it's
educational for other reverse engineering projects with LLM assistance. Feel
free to skip to the [cost](#what-did-it-cost) section if you are not interested
in the technical details. :)

### Decompilation

My first step was to obtain the HP Smart app, which I did from a reasonably reputable source.

I then needed to decompile it. From time spent playing with Android apps a long time
ago, I knew they use a different class format from regular `.class` files, so my existing
decompiler would not work. I used GPT-5.4 Mini within the `pi` coding agent as an impromptu search engine to
recommend the right tools for the job. GPT proactively checked which tools I already
had installed, to confirm that other dependencies like a JVM were present and list only the new packages needed. This was
useful and led to a more targeted answer. However, a Google search would definitely
have sufficed if I wanted to save more tokens.

I decompiled the APK with `jadx`, set up the sources in a fresh folder, and launched
a Claude Code session at the root. From this point onward I did everything in two terminal tabs: one running Claude Code;
the other running a plain shell so I could test the scripts it could produce. I
also had a text editor open to review Claude's scripts for any safety issues
before running them.

### Initial exploration

My first CC session was with Haiku 4.5. I wanted to offload the task of ingesting
and searching for relevant code to the cheapest possible model, and reduce the
number of tokens Sonnet would need to ingest later.

I gave Haiku the following prompt:

> This folder contains the source files for the HP Smart printer app. Determine the SOAP or other API calls it makes to the printer (I believe it’s IP address is 192.168.223.1) in order to configure the WiFi SSID, password, etc. that it connects to.

I mentioned SOAP because the [previous blogger](https://sijisu.eu/posts/writing-hpsimplescan/#pcaps-jadx--chill) I mentioned above
found the scanning API was built with SOAP, and I hoped this would help Haiku find *some* code relating to network
communication with the printer, from which it could then trace dependencies/dependents
to find other code.

Haiku worked for slightly over 2 minutes and then generated a "comprehensive"
API document. It failed to include links to the relevant source files, so I prompted
one more time to add that, which took another minute.

With the analysis complete, I started a fresh session and switched to Sonnet 4.6,
giving it the following prompt:

> Read @HP_SMART_PRINTER_API_ANALYSIS.md and the linked files. Write me the workflow I need to follow to successfully configure my HP printer that is exposing its “HP-Setup” network to connect to my own WiFi network, WPA2, regular passphrase, etc.

I intentionally told Sonnet to read the linked files, as a way of steering it toward
proactively correcting any mistakes made in the Haiku analysis. After 2 minutes
Sonnet provided a plausible-looking workflow, with an "Important Corrections vs. the Analysis Doc"
section at the bottom. This gave me reasonable confidence the model had cross-referenced Haiku's claims against
the actual app code.

Satisfied with the output thus far, I instructed Sonnet to write a Python script
to execute its described workflow; it again finished in 2 minutes.
(Notably, though there were many iterations after this first draft, the user interface
and overall logic of the code stayed the same to the end.)

### Iterating (first session)

Sonnet's first draft tried to connect to `/` on the printer, and thus failed with the same 403 error I encountered the previous
night when trying to connect to the printer myself. I fed the script output back
to Sonnet, along with a reminder that it would not be able to debug the printer manually.
2 minutes of research by Sonnet got us the first important discovery: there
was an XML document, `/DevMgmt/DiscoveryTree.xml`, which needed to be queried to obtain
valid URLs/features on the printer.

The next iteration failed with an SSL handshake failure, which was good
progress; at least the connection was being accepted. Sonnet identified most necessary changes to align the Python script's SSL
configuration with that of the app, but missed one, causing errors to persist. I helped it slightly by running
`curl --insecure -v http://192.168.223.1/DevMgmt/DiscoveryTree.xml`
and providing it with the output. Since `curl` prints the exact SSL ciphers that end
up being used, Sonnet was then able to fix that issue completely without further assistance.
As mentioned earlier, I think the model would have eventually tried the same thing
if it had been able to run commands interacting with the printer.

Now the script was failing to scan for SSIDs with some type of XML parsing issue.
By this point the context window was already polluted with about 100k tokens - all reasoning
and output for the workflow, the first iteration of the script, and the fixes up to this point.
In situations like this I like to start a fresh session to keep the model
operating at peak intelligence, so I prompted:

> Write a summary of the relevant code files to REFERENCES.md for handoff to the next agent

I prefer requesting handoff summaries manually rather than using default compaction,
as it works anywhere (not just in harnesses with a `/compact` command)
and allows me to better curate how the resulting content is written. Compaction
is usually quite opinionated about how the summary is structured.

The generated summary contained *only* references to all the important Java files and
key facts discovered in this session. This was exactly the information I wanted
to begin the next session with.

### The rest of the work

The initial prompt for the second session was pretty simple as well:

<blockquote>
<pre>
Read @REFERENCES.md @hp_wifi_setup.py , the next thing to solve is the following issue:
[... the expected output of the script ...]
GET /IoMgmt/Adapters/Wifi0 → HTTP 405
Scan for available WiFi networks? [y/N] Y
Scanning (this may take ~15s)…
XML parse error: no element found: line 1, column 0
No networks returned — enter SSID manually.

There is an XML parse error and we get 405 from Wifi0. We may need to compare against the reference app.
</pre>
</blockquote>

I kept up the strategy of feeding Sonnet exact output I was seeing. It found two issues and fixed both in about 3-4 minutes.

Now the script could scan networks, but was still unable to make the printer connect to one.
Because I had switched to a new session, Sonnet had forgotten that it did not have
access to the printer, so it attempted to use `curl` to debug the issue itself.
I had to stop and ask it to write debug scripts that I could use and provide it
output from.

With two iterations of debug scripts, Sonnet recognized the last major flaw
in the original draft, with no further assistance from me:

> We’ve been PUTting to the trailing-slash collection which only accepts GET. The PUT must go to /Profiles/1. The whole discover_iomgmt_sub_uris function was also silently broken — the manifest uses a nested ResourceMap/ResourceNode hierarchy with relative URIs, so the flat-sibling parser never found anything and we’ve been running on defaults the whole time.

It took only a minute for it to rectify both problems listed. The resulting
script functioned perfectly, and wireless printing on my network was restored not long after.
Victory.

I made a few minor tweaks for usability (in particular adding a feature to scan
the new network for the printer to find its IP address using `zeroconf`) but the
experiment had proved wildly successful.

In total, I spent no more than an hour and a half on this from start to finish,
excluding the time spent debugging lack of Wi-Fi connectivity the previous night,
and never wrote a line of Python myself. I did, however, read all the code being
proposed by Sonnet before executing it on my host system.

## What did it cost?

~~Everything.~~

In all seriousness, because I use the Anthropic subscription, I did not pay out of pocket for this
specific project, but I have a fixed monthly cost of $20.

The API cost reported by the `/usage` command in Claude Code was about $4, which is dirt cheap
given the results, and the cost of my time to do it by hand. It is unlikely I would
have fully finished reverse engineering HP Smart in an hour.

GPT-5.4 Mini usage was free, because I use it via the Codex free tier.

## Conclusions

There are a couple main takeaways I have from this experience.

I was extremely impressed by Sonnet 4.6's performance, especially given the bad
feedback loop I gave it. My expectation was that I would eventually need to invoke
a more powerful model, or just do some of the detailed parts of the RE myself.
Instead, Sonnet was completely capable of understanding the partially obfuscated
sources. I never looked at a line of the HP app code myself (aside from just now
when writing this, to confirm it really was obfuscated).

This is strong evidence that contrary to what marketing materials & hype would have one believe,
the latest model is hardly necessary for a lot of real-world workloads. It's instead
more important to have a skilled prompter supervising the model and sufficient context
available.

That said, there is a tradeoff in model intelligence. It may have been a mistake to use Haiku, as I suspect its mistakes/incorrect assumptions
propagated into Sonnet's first iteration of the script.
Although Sonnet is obviously capable of correcting the mistakes, the corrections
require additional output tokens which may cost more than the input tokens to have
Sonnet do the exploration.

Finally, I am disappointed that the tech industry is reaching a point that such drastic
measures need to be taken to perform basic configuration of products. We desperately
need regulations or other pressure put on manufacturers to ensure their devices'
basic functionality is available without vendor lock-in.

As mentioned at the beginning, I published the script at [https://github.com/embeddedt/hp-printer-wifi-setup](https://github.com/embeddedt/hp-printer-wifi-setup).
Hopefully it serves as a useful starting point even for those with a different printer model.

If you read all the way to the end, thank you for your time, and I hope you were
able to take away something meaningful from this post, which has set a record
for the longest one on the blog so far.