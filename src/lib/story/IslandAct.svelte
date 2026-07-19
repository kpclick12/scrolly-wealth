<script>
  import Scrolly from "../components/Scrolly.svelte";
  import IslandScene from "../components/IslandScene.svelte";
  import IslandMeter from "../components/IslandMeter.svelte";

  let { data } = $props();
  let currentStep = $state(0);
  let fifthState = $state("takes"); // default per the approved brief: "takes" first

  const figures = $derived(data.island.figures);
  const fork = $derived(data.island.fork);
  const meterMax = $derived(data.island.meterMax);

  const meterValue = $derived(
    figures.reduce((sum, f) => sum + (f.pile[currentStep] ?? 0), 0)
  );

  const steps = [
    { kicker: "One inhabitant", headline: "An island. One person. No money at all." },
    { kicker: "A second arrives", headline: "Specialize, trade, and both eat better" },
    { kicker: "Ideas grow the pie", headline: "A better net, a first field — same hours, more food" },
    { kicker: "The fifth islander", headline: "Someone takes the farmland — and the rules start to matter" },
    { kicker: "Fire", headline: "A fire destroys the fields overnight" },
    { kicker: "A new energy source", headline: "One islander harnesses a force that changes everything" },
    { kicker: "Growth is not sharing", headline: "Richer than ever — not shared even close to evenly" },
  ];
</script>

<section class="act island-act" aria-label="Act 1: The Island" style="--act-accent: var(--ink-teal);">
  <div class="act-head">
    <p class="act-kicker">Act One</p>
    <h2>The Island</h2>
    <p class="act-dek">
      A parable, not data — one imaginary island, five arrivals, and every
      force that later shows up in the real numbers.
    </p>
  </div>

  <Scrolly onStepChange={(i) => (currentStep = i)}>
    {#snippet visual()}
      <div class="island-visual">
        <IslandScene {figures} step={currentStep} {fifthState} />
        <IslandMeter
          value={meterValue}
          max={meterMax}
          showFork={currentStep === 3}
          {fork}
          {fifthState}
        />
      </div>
    {/snippet}

    {#each steps as step, i}
      <section class="scrolly-step" data-index={i}>
        <p class="kicker">{step.kicker}</p>
        <h3>{step.headline}</h3>
        {#if i === 0}
          <p>
            No coins, no prices, no trade — but not zero wealth. There's
            knowledge, tools, shelter, the ability to produce. Wealth is what
            you have and what you can make; money is just how we count it
            later, once there's someone else to count it with.
          </p>
        {:else if i === 1}
          <p>
            One fishes. One hunts. Trade three fish for one rabbit, and each
            eats a fuller, more varied diet than working alone could ever
            produce. Nobody lost anything — together, the two of them make
            more than either could alone.
          </p>
        {:else if i === 2}
          <p>
            A third arrives with a better way to fish. A fourth learns to
            farm. Output rises without anyone working longer hours, and a
            steadier food supply frees up time for better tools and new
            skills. Nobody had to lose for the other two to gain.
          </p>
        {:else if i === 3}
          <p>
            The fifth islander takes control of the field the others
            cleared, and demands half of everything grown there. What
            happens to the island next depends entirely on what the fifth
            islander does with that power.
          </p>
          <div class="toggle-row" role="group" aria-label="What does the fifth islander do?">
            <button
              type="button"
              class="toggle-btn"
              class:active={fifthState === "takes"}
              aria-pressed={fifthState === "takes"}
              onclick={() => (fifthState = "takes")}
            >
              Takes, contributes nothing
            </button>
            <button
              type="button"
              class="toggle-btn"
              class:active={fifthState === "contributes"}
              aria-pressed={fifthState === "contributes"}
              onclick={() => (fifthState = "contributes")}
            >
              Organizes &amp; contributes
            </button>
          </div>
          {#if fifthState === "takes"}
            <p class="toggle-note">
              Half of everyone's harvest disappears into one pile. Output
              stalls, then slides — there's less reason to plant a bigger
              field.
            </p>
          {:else}
            <p class="toggle-note">
              The fifth islander clears more land and coordinates the
              planting. Output keeps climbing — everyone, including the
              fifth islander, ends up with more.
            </p>
          {/if}
          <p class="toggle-moral">
            The lesson isn't who's in charge. It's that rules letting people
            keep enough of what they create are what keep the pie growing.
          </p>
        {:else if i === 4}
          <p>
            Crops, tools, an entire season's food production — gone in an
            evening. The island's wealth drops hard and fast. But the
            knowledge of how to farm, fish and build never burned. That's
            why the island rebuilds faster than it was built the first time.
          </p>
        {:else if i === 5}
          <p>
            Wind, water, fire tamed into real power — one islander finds a
            way to do far more work for far less effort than ever before.
            The island's wealth passes its old peak and keeps climbing. The
            pie was never fixed. It grows through knowledge, cooperation, and
            the rules people choose.
          </p>
        {:else if i === 6}
          <p>
            The island has more food, tools and comfort than at any point in
            its history — and still, one islander may own the most land,
            the best equipment, the biggest inventions. A bigger pie says
            nothing about how the slices are cut. Every island in the real
            world ran this same story — with different rules, and different
            luck. Scroll on.
          </p>
        {/if}
      </section>
    {/each}
  </Scrolly>
</section>

<style>
  .act {
    max-width: 1100px;
    margin: 0 auto;
    padding: 90px 24px 40px;
  }
  .act-head {
    max-width: 640px;
    margin: 0 auto 56px;
    text-align: center;
  }
  .act-kicker {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--act-accent);
    font-weight: 700;
    margin: 0 0 10px;
  }
  .act-head h2 {
    font-family: var(--serif);
    font-size: clamp(28px, 4vw, 40px);
    margin: 0 0 12px;
  }
  .act-dek {
    font-size: 15px;
    color: var(--text-muted);
    margin: 0;
  }

  .island-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .toggle-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 4px 0 12px;
  }
  .toggle-btn {
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    padding: 8px 14px;
    border-radius: 20px;
    border: 1.5px solid var(--border);
    background: var(--page-plane);
    color: var(--text-secondary);
    cursor: pointer;
    transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease;
  }
  .toggle-btn:hover {
    border-color: var(--act-accent);
  }
  .toggle-btn.active {
    background: var(--act-accent);
    border-color: var(--act-accent);
    color: var(--surface-1);
  }
  .toggle-note {
    font-style: italic;
    color: var(--text-secondary);
  }
  .toggle-moral {
    margin-top: 8px;
  }
  @media (max-width: 860px) {
    .toggle-row {
      margin: 2px 0 8px;
      gap: 6px;
    }
    .toggle-btn {
      padding: 6px 12px;
      font-size: 12.5px;
    }
  }
</style>
