// Data is imported statically and bundled with the app — code and data stay
// atomically consistent, and no "Loading…" state is needed.
import netWorth from "../../data/netWorth.json";
import compounding from "../../data/compounding.json";
import wealthCreation from "../../data/wealthCreation.json";
import countries from "../../data/countries.json";
import pyramid from "../../data/pyramid.json";
import thresholds from "../../data/thresholds.json";
import concentration from "../../data/concentration.json";
import wheel from "../../data/wheel.json";
import pie from "../../data/pie.json";

export const appData = {
  netWorth,
  compounding,
  wealthCreation,
  countries,
  pyramid,
  thresholds,
  concentration,
  wheel,
  pie,
};
