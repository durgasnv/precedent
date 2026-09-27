# Problem Statement

## Application Name
**PRECEDENT**<br>
*Institutional memory for technical decisions.*

## Background

Engineering teams make hundreds of technical decisions over the lifetime of a product. They experiment with architectures, libraries, infrastructure, fixes, deployment strategies, and implementation approaches.

The final decision may be documented, but the reasoning behind it often becomes fragmented across pull requests, tickets, chat conversations, meeting notes, and individual team members' memories.

Over time, employees leave, teams change, projects move between owners, and this context becomes difficult to recover.

As a result, a future engineer may propose an approach that the organization has already investigated or attempted—without knowing what happened previously.

## Problem

Organizations lack a reliable form of **persistent institutional memory for technical decisions and failed experiments**.

Existing documentation often captures **what** was decided but not enough of:

- what problem the team was trying to solve;
- what approach was attempted;
- what alternatives were considered;
- what actually happened;
- why an approach failed;
- why the final decision was made;
- which assumptions or constraints influenced that decision;
- under what conditions the rejected approach should be reconsidered.

This creates repeated investigation, repeated experiments, duplicated engineering effort, and loss of knowledge when experienced team members are no longer available.

There is also an important second problem: remembering that an idea failed once is not enough. Technical environments change. A limitation that made an approach unsuitable six months ago may no longer exist.

Therefore, historical decisions should be treated as **context and precedent, not permanent rules**.

## Proposed Solution

PRECEDENT is an AI agent powered by **Hindsight persistent memory** that builds an evolving memory of an organization's technical experiments and decisions.

When an experiment or decision is completed, the system retains structured context such as:

```text
Problem / Goal
      ↓
Approach attempted
      ↓
Outcome
      ↓
Why it succeeded or failed
      ↓
Alternatives considered
      ↓
Final decision
      ↓
Assumptions / constraints
      ↓
Conditions for reconsideration
```

When an engineer later proposes a similar idea, PRECEDENT recalls relevant historical attempts and surfaces the organizational context behind them.

Instead of simply responding:

> "We tried this before."

the system should explain:

> "A similar approach was attempted previously. It failed because of these constraints, which led to this decision."

The engineer can then provide new circumstances. PRECEDENT compares them with the assumptions behind the historical decision and identifies whether the old blocker still appears relevant, may have changed, or cannot yet be determined.

## Example Scenario

A team previously attempted to replace polling with WebSockets for its notification system.

The experiment showed that enterprise customers experienced unstable connections because of restrictive corporate proxies. The team adopted Server-Sent Events instead and retained that decision and its reasoning.

Months later, another engineer proposes:

> "Let's migrate notifications to WebSockets."

PRECEDENT recalls the previous experiment and surfaces:

- what was attempted;
- its outcome;
- the corporate-proxy failure;
- the alternative that was selected;
- the assumption that influenced the decision.

The engineer then explains that the affected customers now use infrastructure that removes the previous proxy limitation.

PRECEDENT can compare this new information against the original blocker and indicate that the historical decision may deserve re-evaluation.

The final technical decision remains with the engineering team.

## Why Persistent Memory Is Essential

Without historical memory, an AI assistant can evaluate only the new proposal and provide generic technical advice.

With Hindsight, PRECEDENT can accumulate organizational experience across interactions:

```text
Past experiments
       +
Past outcomes
       +
Decision reasoning
       +
Original assumptions
       ↓
Hindsight Memory
       ↓
Relevant historical recall
       ↓
Context-aware analysis
```

The usefulness of the agent therefore increases as the organization records more real decisions and outcomes.

Hindsight is not an additional convenience in this workflow; persistent memory is the foundation of the product.

## Target Users

The initial target users are:

- software engineering teams;
- technical leads;
- platform and DevOps teams;
- engineering managers;
- developers joining or inheriting existing systems.

## Core Value Proposition

**Before repeating a technical experiment, understand what your organization already learned from it.**

PRECEDENT helps teams preserve the reasoning behind technical decisions, avoid unknowingly repeating failed approaches, and recognize when changed circumstances make an old decision worth reconsidering.

## MVP Scope

For the hackathon MVP, the system focuses on one workflow:

1. Record a technical experiment or decision.
2. Retain its context using Hindsight.
3. Submit a new technical proposal.
4. Recall related historical decisions.
5. Explain why the historical memory is relevant.
6. Provide changed circumstances.
7. Compare those circumstances with the original assumptions.
8. Present evidence and analysis to the engineer.

The MVP does **not** attempt to become a general organizational knowledge-management platform.

## Hackathon Alignment

The official problem statement requires projects to use Hindsight so that an AI application can remember, recall, and improve over time rather than forgetting previous interactions.

PRECEDENT demonstrates this through a clear progression:

```text
Without organizational memory
        ↓
Generic technical analysis

With accumulated memory
        ↓
Relevant previous attempt recalled
        ↓
Failure reasoning recovered
        ↓
Original assumptions identified
        ↓
Current circumstances compared
        ↓
More context-aware analysis
```

This keeps memory central to the user value and creates a visible before/after demonstration.

## Success Criteria

The project succeeds when a live demonstration can show that:

- a real technical decision is retained through Hindsight;
- a later related proposal recalls that decision;
- the agent's response materially changes because of the recalled memory;
- the user can see the evidence behind the historical match;
- the system remembers why an approach failed rather than merely that it failed;
- changed assumptions can cause an old decision to be flagged for re-evaluation;
- the final decision remains transparent and human-controlled.
