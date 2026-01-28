import { useMemo, useState } from "react";
import "./App.css";

const UNITS = ["C", "F", "K"];

function toCelsius(value, from) {
  switch (from) {
    case "C":
      return value;
    case "F":
      return (value - 32) * (5 / 9);
    case "K":
      return value - 273.15;
    default:
      throw new Error("Invalid source unit");
  }
}

function fromCelsius(celsius, to) {
  switch (to) {
    case "C":
      return celsius;
    case "F":
      return celsius * (9 / 5) + 32;
    case "K":
      return celsius + 273.15;
    default:
      throw new Error("Invalid target unit");
  }
}

function formatNumber(n) {
  // keeps output clean and stable
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
    n,
  );
}

function absoluteZeroC(unit) {
  // return absolute zero in the chosen unit (for validation messaging)
  switch (unit) {
    case "C":
      return -273.15;
    case "F":
      return -459.67;
    case "K":
      return 0;
    default:
      return null;
  }
}

function validateAbsoluteZero(value, unit) {
  const az = absoluteZeroC(unit);
  if (az === null) return { ok: false, message: "Invalid unit selected." };
  if (value < az - 1e-9) {
    return {
      ok: false,
      message: `Value is below absolute zero for ${unit}. Minimum is ${az}.`,
    };
  }
  return { ok: true, message: "" };
}

export default function App() {
  const [temp, setTemp] = useState("");
  const [fromUnit, setFromUnit] = useState("C");
  const [toUnit, setToUnit] = useState("F");
  const [error, setError] = useState("");

  const parsed = useMemo(() => {
    if (temp.trim() === "") return { ok: false, value: null };
    const n = Number(temp);
    return { ok: Number.isFinite(n), value: n };
  }, [temp]);

  const result = useMemo(() => {
    setError("");

    if (!parsed.ok) {
      if (temp.trim() === "") return null; // no error yet
      setError("Temperature must be a valid number (e.g., 25, -10.5, 300).");
      return null;
    }

    const v = parsed.value;

    // Absolute zero validation in input unit
    const check = validateAbsoluteZero(v, fromUnit);
    if (!check.ok) {
      setError(check.message);
      return null;
    }

    if (fromUnit === toUnit) return v;

    try {
      const c = toCelsius(v, fromUnit);
      const out = fromCelsius(c, toUnit);

      // Also ensure output Kelvin never goes below 0 due to rounding weirdness
      if (toUnit === "K" && out < -1e-9) {
        setError("Resulting Kelvin is invalid (below 0).");
        return null;
      }

      return out;
    } catch {
      setError("Conversion failed. Please check your inputs.");
      return null;
    }
  }, [temp, fromUnit, toUnit, parsed.ok, parsed.value]);

  function swapUnits() {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  }

  function reset() {
    setTemp("");
    setFromUnit("C");
    setToUnit("F");
    setError("");
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Temperature Conversion System</h1>
        <p className="subtitle">
          Convert between Celsius (C), Fahrenheit (F), and Kelvin (K). Handles
          invalid inputs gracefully.
        </p>

        <div className="grid">
          <div className="field">
            <label>Temperature value</label>
            <input
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              inputMode="decimal"
              placeholder="e.g., 25"
              aria-label="Temperature value"
            />
          </div>

          <div className="field">
            <label>From</label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <small className="hint">
              Min: {absoluteZeroC(fromUnit)}°{fromUnit}
            </small>
          </div>

          <div className="field">
            <label>To</label>
            <select value={toUnit} onChange={(e) => setToUnit(e.target.value)}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="actions">
          <button className="btn" onClick={swapUnits} type="button">
            Swap Units
          </button>
          <button className="btn secondary" onClick={reset} type="button">
            Reset
          </button>
        </div>

        <div className="result">
          <div className="resultLabel">Result</div>
          <div className="resultValue">
            {result === null ? "—" : `${formatNumber(result)}°${toUnit}`}
          </div>

          {error ? <div className="error">{error}</div> : null}

          {!error && parsed.ok && temp.trim() !== "" ? (
            <div className="meta">
              {formatNumber(parsed.value)}°{fromUnit} → {formatNumber(result)}°
              {toUnit}
            </div>
          ) : null}
        </div>
      </div>

      <footer className="footer">
        <span>Task-01 • Orphion Internship</span>
      </footer>
    </div>
  );
}
