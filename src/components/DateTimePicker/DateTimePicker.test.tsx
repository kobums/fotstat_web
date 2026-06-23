import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DateTimePicker from "./DateTimePicker";

// `value` ("YYYY-MM-DDTHH:mm") fixes both the visible month and the time
// selects, keeping the test independent of the current date.
function Harness({
  initial = "2026-06-15T14:30",
  onChange,
}: {
  initial?: string;
  onChange?: (v: string) => void;
}) {
  const [v, setV] = useState(initial);
  return (
    <DateTimePicker
      value={v}
      onChange={(next) => {
        setV(next);
        onChange?.(next);
      }}
      minuteStep={10}
    />
  );
}

describe("DateTimePicker", () => {
  it("keeps the time when a calendar day is picked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "20" }));

    expect(onChange).toHaveBeenCalledWith("2026-06-20T14:30");
  });

  it("updates the hour while keeping the date and minute", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole("combobox", { name: "시" }));
    await user.click(screen.getByRole("option", { name: "09시" }));

    expect(onChange).toHaveBeenCalledWith("2026-06-15T09:30");
  });

  it("updates the minute while keeping the date and hour", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole("combobox", { name: "분" }));
    await user.click(screen.getByRole("option", { name: "40분" }));

    expect(onChange).toHaveBeenCalledWith("2026-06-15T14:40");
  });

  it("snaps an off-step stored minute to the nearest option", () => {
    // 35 isn't a 10-minute boundary -> should display 40분.
    render(<Harness initial="2026-06-15T14:35" />);
    expect(screen.getByRole("combobox", { name: "분" })).toHaveTextContent("40분");
  });
});
