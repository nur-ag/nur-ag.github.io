---
title: On Commercial LLMs as Coding Assistants
layout: post
category: research
tags: [research, llms, hype, utility, coding, automation]
logo: file-code
summary: "Or how to surf the hype and ship without hallucinating!"
---

<style>
/* Shamelessly lifted from https://www.w3schools.com/css/css_tooltip.asp */
.tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: black;
  color: #fff;
  text-align: center;
  padding: 5px 0;
  border-radius: 6px;

  position: absolute;
  z-index: 1;

  padding: 4px;
  width: 300px;
  bottom: 100%;
  left: 50%;
  margin-left: -150px;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
}

.tooltip .tooltiptext::after {
  content: " ";
  position: absolute;
  top: 100%; /* At the bottom of the tooltip */
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: black transparent transparent transparent;
}
</style>

For the past weeks, I have been on <span class="tooltip">parental leave<span class="tooltiptext">From Amazon. Note all views shared from this exploration are mine only!</span></span> with my son while he starts kindergarten. In the breaks during his naps, I wanted to explore new ground and learn a thing or two. How about playing with commercial LLMs as coding assistants? There is plenty of hype around LLMs and deprecating programmers—and it's good to figure out if you'll soon be out of a job!

I took on a couple of side projects to assess strengths, weaknesses, and whether I could come up with a good workflow for myself. There's plenty written about LLMs, what they can or cannot do, and whether they are 'intelligent'. For this post, I don't care—I care about whether they are _useful_ for _my_ practical use-cases. My aim was to figure out from first principles how _I_ can make an LLM work for me, then see if tools like [Cursor](https://www.cursor.com) made a difference in my productivity. I used [Claude Sonnet 3.5](https://www.anthropic.com/news/claude-3-5-sonnet), but my approach should apply with any equally capable model. 

## Preface: what was I thinking?

I started from scratch: if I were to implement a coding assistant, how would I go about it?
My thought process was that I have a <span class="tooltip">generative model<span class="tooltiptext">Ideally a local one. I may try a small Llama on my 2015 MBP!</span></span>, a piece of code (e.g. a single code file, to 
simplify—this can be empty), and a task that I would want to perform on this piece of code. The task could have parameters of its own ('modify function `my_little_function` in lines 26-37 to support passing ints or floats in the `timeout_delay` variable'). This parametrization was not important for me yet—I still had to figure out the basics.

I got myself the Claude subscription to get higher usage limits (that I still hit). After some manual tinkering, my workflow was to copy full pieces of code (where ready), including them in a prompt that would have the LLM generate either small diffs or a first iteration of the implementation. 

## Attempt #1: An LLM as a Game Programmer?

Following the first 'Hello World' runs, I sketched up a problem that would be interesting enough to solve—a small game inspired by Kwirk, a Gameboy puzzle game that I played plenty as a kid.

<iframe style="width: 100%; height: 20rem;" src="https://www.youtube.com/embed/X_UQYUIYYHs?si=323mPazywgfaHTpP" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

Implementing the logic of a puzzle game seemed like a good project:
1. It required reasoning through a set of game rules that Claude would have not seen before.
2. It tested reasoning 'beyond code'—is a level winnable? how would a trace for a level look like?
3. It's better to start with something fun!

I added a few additional game elements—a 35 year old GameBoy game only involves so much complexity. Besides the pushable blocks, holes and turnstiles in Kwirk, I decided to add laser beams and colored key / doors. This would ensure that memorization of game guides like [this one](https://gamefaqs.gamespot.com/gameboy/585783-kwirk/faqs/8670) during training would not be an issue. 

Initially, I got Claude to implement the game in Scala with a purely functional approach. Although first drafts were promising, it did not manage to get an interactive CLI working without dependencies. I simplified the task and focused on a Python implementation, reasoning that it'd be easier to work in popular Python with simpler constraints. My prompt was: 

<script src="https://gist.github.com/nur-ag/cc1609da02e3fc5175545e5bc7b09a22.js"></script>

With some elbow grease (15 turns in the conversation), I managed to get a playable version, with Claude generating levels for me to try out. It had several bugs, some of which required me to review and suggest ways out of the block. For some issues, it simply got stuck and I had to refactor code blocks myself—a thought writing this is that I wish I had documented these failures to categorize them now. After iterating on it on and off for 6 days, I had an implementation that fit the specification, working on the terminal, loading arbitrary levels in .json. 

The implementation was a 'monolith'—all the code of the game, dumped in one single file. At this point, my workflow was uploading the full implementation as an artifact, plus level files for debugging if needed (with a maximum of 5 files per turn). As one would expect, restarting the conversation and providing a specific prompt with clear examples often was the best way of guiding Claude in the right direction.

## Attempt #2: An LLM <strike>builds a Coding Assistant</strike> as a Code Translator?

After some days of a break to simmer on what I had learned, I jumped back in. I should have signed up for the API Console at this point. However, since I was already paying for the Pro plan, I figured I could 'mock' the usage I would do for the API for the time being. My objective was clear: how could I break up the monolith? This approach to development was not practical, so I wanted to figure out if I could implement a naïve way of dealing with a structured project.

The obvious solution that popped into my head was to implement a method to represent the state of a subset of a project so that the LLM could process it as a single artifact. A straightforward implementation is to `cat` the files with their relative paths, such that our task can be:

> Modify the function `read_data` in the `core.data.io` module to support Parquet files, update all usages in `app.entrypoints` so that we use Parquet by default instead of CSV, and adjust the unit tests to match the implementation.
> 

Note that for the unit tests we wouldn't even bother giving out the exact path: if we pass the relevant part of the codebase, the model should be able to figure it out. We could also think of a multi-turn setup, where we provide the task and some highlighted files, alongside the current folder structure of the project. Using multiple prompts, we could match the task against the folder structure and introduce more code files before jumping into the implementation.

This concatenation 'operation' has an obvious complement: given a code artifact where code diffs for each input file are clearly marked, apply the proposed diffs by matching against the modified file(s). When thinking through these two operations, a lightbulb popped into my head: what if I tasked Claude with an implementation? I went and did just that, implementing the naïve version: simply concatenate or all the files recursively, matching some criteria. The two prompts were [this](https://gist.github.com/nur-ag/60359cc1630b177634a6b4e2c578fe6d) and [that](https://gist.github.com/nur-ag/414ece8dff778a123e8ec5e18620fe0a) respectively—the code in the prompt for exploding came from the result of running the concatenation prompt as-is!

My focus was still on building out the game, and as a requirement I expected a graphical interface. I could have continued in Python and used Pygame, but instead I went on to try a different use-case: given a working, monolithic codebase in language A, can Claude translate it into several modules in language B? In hindsight, I should have continued pushing the self-improvement loop: how can we make the concatenate and explode scripts smart enough so that they apply _valid_ changes in the _correct_ position without hallucination or duplication? Those are primitive operations for a transformation workflow, can be modelled as patches (à la git), and could introduce a 'reflection budget' so that the assistant can challenge itself. Alas, <span class="tooltip">I did not<span class="tooltiptext">Yet! This is one of a few promising directions after toying out with this problem space.</span></span>—I will come back to discuss validity, correctness and hallucinations in the next section.

At this point, we could use`concatenate <params> | pbcopy` and `pbpaste | explode <params>` <span class="tooltip">commands<span class="tooltiptext">pbpaste and pbcopy are methods to paste and copy from / to the paste buffer in Mac OS, respectively.</span></span> to iterate on a codebase. The paste buffer can be sent over to Claude directly, so this workflow plus a prompt can get us to operate on a structured project. Can we convert our Python monolith into a JavaScript project split into multiple, somewhat sane files? I used this prompt to find out:

<script src="https://gist.github.com/nur-ag/64c6a5f3275406f54233de40744c59d7.js"></script>

The conversion also took some work, but considerably less than I would expect for a full rewrite in a different language. Claude did not produce a working project by itself: it insisted that I needed Node to load the JavaScript files, so after some back and forth I went on to debug the structure of the project by myself. In the process, I found some of the functionality was not correctly translated over. With heavy prodding and some manual help, it got over the hurdles—it was clear at this point that problems arose most often for tasks where game logic needed to be traced. However, this is not often the case in most projects. Claude certainly sped up my dev. time for rendering, interface, and boilerplate components with a naïve 'reinvent-the-wheel' workflow. There is certainly meat in here, although it still takes some trimming and cooking.

I spent the last stretch of this attempt polishing the interface. I was surprised by how relatively little work was needed on top of prompts for interfaces, considering I was 'rolling my own renderer' by painting on an HTML5 canvas. Claude was competent, although some times it did not manage to implement the requirements despite sharing screenshots—likely because it couldn't relate them back to the implementation. One possible extension here would be to look into actual rendering libraries for JavaScript, and seeing if hallucinations become a significant problem in that setting. I will explore a library-heavy project next, but for now: you can actually play the resulting `kwirk-js` project [here](/projects/kwirk-js/) (or in the embedded iframe below!). Controls are WASD / Arrow keys plus 'C' to change character. All in all, this attempt topped at 1137 lines written over 2-3 days, so around 450 LoC per day—a number I can comfortably beat on my own.

<iframe style="width: 100%; height: 20rem;" src="/projects/kwirk-js/" title="Kwirk-js" frameborder="0" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Attempt #3: _I_ build a Project Management app _with_ an LLM?

After attempt #2, I had a better grasp of where Claude could help _me_, using the 'publicly available interface' with the Pro plan. However, serious attempts to integrate LLMs into development workflows would inevitably start from the <span class="tooltip">editor or IDE.<span class="tooltiptext">When reasoning about a problem for the first time, I skip editors in favor of text editors: nano or SublimeText. All the code for my PhD I wrote without IDEs, despite using them professionally in parallel—quite the masochist!</span></span> I went out to scout for alternatives, including plugins, new editors, and everything in between. I found [Zed](https://zed.dev), [Cursor](https://www.cursor.com) and [Void](https://voideditor.com), as well as some VSCode plugins like [Cline](https://github.com/cline/cline) or [Continue](https://www.continue.dev). Since Cursor provides access to a variety of models—including Claude Sonnet 3.5—during the 2 week trial period, I decided to go with it for both popularity bias and simplicity. 

What's the task this time around? Yet another iteration of the same game? No, although that would make the methodology <span class="tooltip">more sound<span class="tooltiptext">I focused on learning, so being sound, rigorous, and strict was not part of the goal. They may be good for follow-ups!</span></span>. Instead, I set up a project where I would design the high-level structure and have Cursor (via Claude) implement the content. My wife is an interior designer and she is often frustrated with the poor state of tooling at work. Thus: how about a platform for managing interior design projects? I went on to sketch up a monorepo architecture for a generic <span class="tooltip">PWA<span class="tooltiptext">Progressive Web App — I may want to have this on my homescreen on iOS!</span></span> using [Vue3](https://vuejs.org) with [Bulma CSS](https://bulma.io) for the front-end and [FastAPI](https://fastapi.tiangolo.com) for the backend. I used Github Actions for CI just to have something running in a free tier. My stretch goal was to manage all infrastructure through Terraform, Pulumi or the AWS CDK, but I didn't get there—and don't think it matters much for my findings.

This tech stack was idiosyncratic: I've used Vue 2 and Bulma before and enjoyed using them, and although I haven't used FastAPI, I've glanced over the top-notch documentation a couple of times & wanted to give it a try. One key aspect is that I did not have _direct_ experience with them, so part of my objective was to see whether I would be productive with a coding assistant / LLM-based autocomplete, or instead dumbfounded by the hallucinations. Besides designing the skeleton of the project, I applied the lessons from my previous attempts—I had to be _strict_ with the development workflow.

On <span class="tooltip">Twitter<span class="tooltiptext">Currently known as X.</span></span>, _cracked_ programmers often talk about _slop_: the deep, dark mud that builds on codebases as they rot away. Using these models without care is a surefire way of sneaking _slop_ extraordinaire into your next code review. How could I short-circuit the instict to LGTM every autocompletion until the code is an unmaintainable mess? Enforcing reviews. And how would I enforce reviews on a solo project? Through a development loop where all modules in the monorepo are _built_, _tested_, _linted_ in every iteration, with at least 95% line / branch / statement coverage on the whole codebase.  I still had plenty of hallucinations—Claude insists I _must_ integrate with Stripe if I want to set up a "Sign and Pay" button. However, this process forced me to look at both the code and the tests, which I produced through prompting & no manual intervention in most cases. Not too bad!

### Jumping into the show!

So how did it go? I started by prompting for a first draft, just a landing page for the platform-to-be with a mailing list (I thought of recreating [this blogpost](https://blog.marcolancini.it/2020/blog-serverless-mailing-list/#reporting)). The backend was simple: a subscription API where users can subscribe an email to a mailing list. If an email is already subscribed, we return an error, and we do light validation to ensure the email is valid. The API did not actually deal with any persistence layer: a plain old Python set, in memory, was all there is. The front-end was a simple landing message, a display of the _features_ that the platform will have, as well as the subscription form. Nothing more, nothing else but a nav bar and a footer. I used Jest to test the spec in JS, Pytest for the API tests, and let Cursor write the tests for me. So far, so good: 100% test coverage and both the tests and implementation made sense—with 1009 lines (including project setup boilerplate). I also set up the build system as scripts in the `package.json` of the root, so that my development flow (using [Bun](https://bun.sh) rather than Node) would be as simple as:

```bash
bun run clean && bun run build && bun run start
```

As I started development, Cursor (through Claude) was frequently biased towards popularity: it would often autocomplete with Vue 2 style syntax, drifting off from the codebase. In other cases, when the libraries were uncommon, it completely hallucinated the interfaces—this was appalling when testing, since it would insist on testing components in ways that would not work. The high thresholds for line and branch coverage forced me to review most of the 'risky code' where I was interacting with dependencies, read thoroughly through the docs, and figure out a path forward before passing the stick back to Cursor.

In a production, real-world use-case, I would ditch the 95% threshold and go higher, enforcing at the file-level rather than codebase-wide. Otherwise _slop_ will creep in as the codebase evolves over the threshold _in general_ but risky components (that pull dependencies or involve more complex logic, i.e., where _your attention is needed_) can slip by. These components will also be harder to test, so there is a perverse incentive to skip them, 'leave for the follow-up review'. I had not used Jest before, but I was happy to see that [the option to have file-level thresholds is supported](https://jestjs.io/docs/configuration#coveragethreshold-object)—unlike in Pytest, [as far as I could see, from this issue](https://github.com/pytest-dev/pytest-cov/issues/444). One key takeaway is that as code assistants improve and the bugs they introduce become more subtle, engineering teams will need to increase the friction for untested, unaudited lines of code. 

From this point on, feeling more confident in my workflow, I started building up the project. The next step was actually designing the 'real' front-end. I expected that Cursor and Claude would do well based on my previous iterations. In general, it was the case, though it was over-eager to add code. For instance, almost all my Vue components started with scoped style blocks that were unnecessary. Despite prompting that the components should use Bulma CSS classes where required, Claude would introduce additional CSS, unprompted. This is not something that unit tests would catch, and my styling chops are not advanced enough to know if there are mechanisms to flag unexpected CSS. In this world, building applications with _consistent_ feel across them becomes harder—the TAB autocomplete is just too tempting, the 600-line change on the component is an <span class="tooltip">LGTM-magnet<span class="tooltiptext">You may also be tempted to just send 👍</span></span>. 

Before I digress—I kept working on this on and off, between naps from my son, trying to squeeze as much of the 14-day Cursor trial as I could:

![Screenshot of my commit log.](/imgs/llm-post/CommitLog.png)

After the two initial commits, I implemented the full skeleton for navigating the logged in / anonymous views—going from 628 lines of actual code to 3686. The full sketch of a project view end-to-end followed. Here I added views to <span class="tooltip">draft the project<span class="tooltiptext">In a Markdown Editor with popping WYSIWYG buttons! I would like to see if I can make it support collaborative editing. We'll see if I have time when I'm back to work!</span></span>, send it to a customer for approval, rendering a .pdf contract and signing before paying, keeping track of all orders related to a signed project and their status, and finally delivering the completed project including installation and pending down-payment. This last step pushed the total code in the codebase up to 9099 lines, measured as 'raw' lines (which includes whitespace and empty lines):

```bash
find -E . -regex ".*\.(vue|js|py|html)" | \
  grep -v 'node_modules\|venv\|coverage\|.config' | \
  xargs  wc -l
```

On correctness, validity, and hallucinations: these problems came with either underspecified prompts, smaller libraries, or very popular approaches to solve a problem (I'm looking at you, Stripe!). For instance, the contract signature view uses [Vue3 SignaturePad](https://vue3-signature-pad.vercel.app), which Claude had a hard time testing. Eventually, with some prompting, some searching around, and some manual tinkering, I got it to work. However, this will be much harder if you went wild with a code assistant and bring tests later: incompatible assumptions when piling completions upon completions, although sometimes _do_ work, make testing impossible.

Throughout the project, my intention was to write no code at all, only getting involved if prompting was not enough for one reason or another. There is a learning curve to this process, and in a practical setting I wouldn't be nearly as insistent. In many cases, I prompted multiple times even though there was a clear solution that _I_ could see. This is promising in the sense that whatever learnings I have here, I treat as a conservative estimate of productivity (and perhaps convince you that this is a reasonable assumption!). For instance, testing the interface was tedious as Cursor did not figure out quite how to test Vue components for coverage—ignoring that besides the code in the script tag, templates also execute logic through the e.g. `v-if` directive. I distilled my prompts to address these cases, and eventually got a working template that would read like:

<script src="https://gist.github.com/nur-ag/f3e86de88b35301fbe644c10bfbc0155.js"></script>

Implementing the FastAPI back-end was straightforward. By the time I got into it, I was also more proficient with Cursor, which I learned lets you provide pointers to files, documentation, or have the IDE perform a web search to figure things out (shoutout to Attempt #2!). However, the implementation of a REST API is formulaic, and autocomplete-on-stereoids performing well is not surprising. It still took some effort here and there to get past the coverage thresholds, specially once I started implementing support for authentication via OAuth2 using Bearer JWT tokens. For such parts of 'critical' application code, I did not autocomplete nearly as much and steadily went over the implementation, touching it up in the process, to make sure all was correct—or seemed so. The global coverage reports look good, with 350 tests for the front-end and 182 tests for the back-end: 

```
bun run clean && bun run build && bun run start
... edited for brevity
-----------------------------------|---------|----------|---------|---------|------------------
File                               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------------------|---------|----------|---------|---------|------------------
All files                          |   96.49 |     95.1 |   82.25 |   96.58 |
-----------------------------------|---------|----------|---------|---------|------------------

Test Suites: 48 passed, 48 total
Tests:       350 passed, 350 total
Snapshots:   0 total
Time:        8.659 s

===================================== test session starts =====================================
platform darwin -- Python 3.12.5, pytest-8.3.3, pluggy-1.5.0
rootdir: ./calm-studio/calm-backend
configfile: pyproject.toml
testpaths: tests
plugins: anyio-4.6.1, timeout-2.1.0, cov-4.0.0
timeout: 10.0s
timeout method: signal
timeout func_only: False
collected 182 items
---------- coverage: platform darwin, python 3.12.5-final-0 ----------
Name                                     Stmts   Miss Branch BrPart  Cover   Missing
------------------------------------------------------------------------------------
TOTAL                                      827     19    106     13    97%

Required test coverage of 95% reached. Total coverage: 96.57%
```

It is hard to see how many of these tests are testing overlapping functionality, the same statements and branches. This is a risk in that we bring in large diffs when we _do_ change functionality, with dwindling confidence as we are unsure the tests were _meant_ to test the same thing. One possible mitigation is to warn or raise an error if a test hits exactly the same statements and branches as other test—though as far as I can tell, this behavior is not supported in most standard tools nowadays.

The cognitive load of looking at the diffs generated by an LLM is quite high, and not only because of the volume of code. What would have been a bunch of comments in a review is addressed instant and often produces a slew of new changes, some of which are unrelated to the previous ones. This is a key issue: I expect LLM-assisted codebases to have diffs with a larger variance than strictly human ones—both between revisions within a review, and between any given review and a target branch. This was one of my first pain-points: changes would restructure large parts of code with seemingly identical behavior (that sometimes wasn't!). High-threshold testing helped, but it did not help in the cases where changes were visual, such as data display components in the front-end. The bottom line is that there is plenty for engineers to do before they are deprecated—at least for the time being!

I am writing this at the end of the line, with fully tested front-end and back-end modules, but lacking both their integration and infrastructure. The project sits at 12916 lines, written in no more than 25 hours of work. This is a work-week (or two) for a software engineer that managed to escape some meetings (or didn't). One final takeaway: at ~500 lines of code per hour, fully unit tested, the cost of code for run-off-the-mill web apps is going to tend to zero very soon.

## Conclusions & Takeaways

This excursion through La-La-LLM-Land has been quite the journey. If you are in a hurry, main takeaways:

* Using LLMs as code assistants is definitely useful for well structured, standard programming tasks—they struggle with big picture, formal reasoning problems. Those are a small subset of any project where you still have to deal with I/O, boilerplate, data models, etc.
* These code assistants make the value of routine code tend to 0, but the value of precise, correct, efficient, minimal implementations will likely _increase_. The reasons are two-fold:
	- In the near future, there will be catastrophic failures in domains where these properties are needed and some code assistant runs amok. Businesses that cannot afford to fail will figure out that they cannot afford to skimp.
	- The number of engineers that can perform unassistable work in these will remain rare, and will be a smaller fraction of a growing developer community so their compensation will raise. Cryptography, embedded systems, graphics, ML, and robotics software engineers will likely benefit, while web/app centric engineering teams may increase throughput or shrink.
* Despite their utility, <span class="tooltip">LLMs are prone to introduce defects<span class="tooltiptext">The same applies for human programmers, but the _rate_ and _velocity_ of defects is different. Humans' lower throughput acts as a bottleneck in the "rate of decay" for a codebase.</span></span>, and those defects are hard to catch. Engineering teams will need to improve tooling and enforce harsher coding and review practices to catch unaudited, untested code.
	- One aspect I have not explored was integration between LLM-assisted codebases. If the premise of LLMs introducing more variance holds, the surface for issues when integrating different systems also increases. 
	- Requiring higher coverage thresholds while unit testing, avoiding spurious code, and reducing duplication will become more important. 
	- There is a billion-dollar business hiding behind figuring out how to automatically apply best practices so that an engineering team can ship new LLM-assisted features with similar or lower defect rates than a human-only team.
* I focused on building prototypes end-to-end, but software lives most of its life in maintenance, and eventually in a _long_ deprecation path. 
	- I can see my findings extrapolating well to greenfield components within a codebase, but less so for challenging refactors that require a good grasp of the structure of the project. 
	- Current limitations for 'project-aware transformations' are likely not limitations of the models themselves, but due to how we use them. There are smarter ways of building the context that is fed into a model. 
		+ The meta-task is to assess what needs to be changed, what is the most idiomatic change given the environment (language, codebase, and module), and what is the most precise way to assess its correctness. 
		+ This seems automatable to the degree of pattern matching that LLMs currently have and will continue to improve on.
	- Being able to prototype an app in 25 hours that would have likely taken in the order of hundreds before (days vs weeks) is incredibly valuable. Early stage companies building software as a means to an end (i.e. the ones that understand they must solve problems, rather than create solutions) will ship more, faster—the bottleneck becomes infrastructure and physical assets.
	
