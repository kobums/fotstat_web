import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DatePicker from "./DatePicker";

// `value` fixes the calendar's visible month, keeping the test independent of
// today's date.
function Harness({
  initial = "2026-06-15",
  min,
  max,
  onChange,
}: {
  initial?: string;
  min?: string;
  max?: string;
  onChange?: (v: string) => void;
}) {
  const [v, setV] = useState(initial);
  return (
    <DatePicker
      value={v}
      onChange={(d) => {
        setV(d);
        onChange?.(d);
      }}
      min={min}
      max={max}
      aria-label="경기 날짜"
    />
  );
}

describe("DatePicker", () => {
  it("renders the value as a dotted label", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "경기 날짜" })).toHaveTextContent(
      "2026.06.15",
    );
  });

  it("shows the placeholder when there is no value", () => {
    render(<DatePicker value="" onChange={() => {}} placeholder="날짜 선택" />);
    expect(screen.getByRole("button")).toHaveTextContent("날짜 선택");
  });

  it("opens the calendar and emits YYYY-MM-DD for the picked day", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "경기 날짜" }));
    expect(screen.getByText("2026년 6월")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "20" }));

    expect(onChange).toHaveBeenCalledWith("2026-06-20");
    expect(screen.getByRole("button", { name: "경기 날짜" })).toHaveTextContent(
      "2026.06.20",
    );
    // Picking a day closes the popover.
    expect(screen.queryByText("2026년 6월")).toBeNull();
  });

  it("disables days outside the min bound", async () => {
    const user = userEvent.setup();
    render(<Harness min="2026-06-10" />);

    await user.click(screen.getByRole("button", { name: "경기 날짜" }));

    expect(screen.getByRole("button", { name: "5" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "20" })).toBeEnabled();
  });

  it("disables days outside the max bound", async () => {
    const user = userEvent.setup();
    render(<Harness max="2026-06-10" />);

    await user.click(screen.getByRole("button", { name: "경기 날짜" }));

    expect(screen.getByRole("button", { name: "20" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "5" })).toBeEnabled();
  });
});
