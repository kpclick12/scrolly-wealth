<script>
  // Horizontal 100%-stacked bars with a 2px gap between segments.
  // rows: [{ label, sublabel?, note?, parts: [{ key, value, color, light? }] }]
  // Segment values in percent (sum ~100). Labels are drawn inside segments >= minLabel.
  // active: replay the grow-in animation whenever this chart becomes the
  // current step, not just on first mount — needed now that visuals stay
  // mounted across a whole act instead of remounting per step.
  let { rows = [], title = "", minLabel = 7, legend = [], active = true } = $props();

  let revealed = $state(false);
  $effect(() => {
    if (active) {
      revealed = false;
      let raf1 = requestAnimationFrame(() => {
        raf1 = requestAnimationFrame(() => (revealed = true));
      });
      return () => cancelAnimationFrame(raf1);
    }
    revealed = false;
  });
</script>

<figure class="stackedbars">
  {#if title}<figcaption class="title">{title}</figcaption>{/if}
  {#if legend.length}
    <div class="legend">
      {#each legend as l}
        <span class="legend-item"><span class="swatch" style="background:{l.color}"></span>{l.key}</span>
      {/each}
    </div>
  {/if}
  <div class="rows">
    {#each rows as row, ri}
      <div class="row">
        <span class="label">
          {row.label}
          {#if row.sublabel}<span class="sublabel">{row.sublabel}</span>{/if}
        </span>
        <div class="track" class:revealed style="transition-delay: {ri * 120}ms">
          {#each row.parts as p (p.key)}
            <div
              class="seg"
              style="flex-basis:{Math.max(p.value, 0.4)}%; background:{p.color}"
              title="{p.key}: {p.value}%"
            >
              {#if p.value >= minLabel}
                <span class="seg-label" class:on-light={p.light}>{p.value.toFixed(0)}%</span>
              {/if}
            </div>
          {/each}
        </div>
        {#if row.note}<span class="row-note">{row.note}</span>{/if}
      </div>
    {/each}
  </div>
</figure>

<style>
  .stackedbars {
    margin: 0;
    width: 100%;
    max-width: 560px;
  }
  .title {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 12px;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin-bottom: 12px;
  }
  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-secondary);
  }
  .swatch {
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .label {
    display: block;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 6px;
  }
  .sublabel {
    font-weight: 400;
    color: var(--text-muted);
    margin-left: 6px;
    font-size: 12.5px;
  }
  .track {
    display: flex;
    gap: 2px;
    height: 34px;
    border-radius: 5px;
    overflow: hidden;
    opacity: 0;
    transform: scaleX(0.6);
    transform-origin: left;
    transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.25, 1, 0.35, 1);
  }
  .track.revealed {
    opacity: 1;
    transform: scaleX(1);
  }
  .seg {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
  }
  .seg-label {
    font-size: 11.5px;
    font-weight: 700;
    color: #ffffff;
    font-variant-numeric: tabular-nums;
  }
  .seg-label.on-light {
    color: #201a12;
  }
  .row-note {
    display: block;
    margin-top: 4px;
    font-size: 11.5px;
    color: var(--text-muted);
  }
  @media (max-width: 860px) {
    .track {
      height: 28px;
    }
    .label {
      font-size: 12.5px;
    }
  }
</style>
