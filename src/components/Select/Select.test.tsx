import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Select from "./Select";

const OPTIONS = [
  { value: "gk", label: "골키퍼" },
  { value: "df", label: "수비수" },
  { value: "mf", label: "미드필더" },
];

// Controlled harness so the trigger reflects the new value after selection,
// mirroring how callers drive the component.
function Harness({ onChange }: { onChange?: (v: string) => void }) {
  const [value, setValue] = useState("gk");
  return (
    <Select
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
      options={OPTIONS}
      aria-label="포지션"
    />
  );
}

describe("Select", () => {
  it("shows the selected option's label on the trigger", () => {
    render(<Harness />);
    expect(screen.getByRole("combobox")).toHaveTextContent("골키퍼");
  });

  it("opens the listbox and renders every option on click", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByRole("listbox")).toBeNull();

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("selects an option on click, calling onChange and closing the menu", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "미드필더" }));

    expect(onChange).toHaveBeenCalledWith("mf");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByRole("combobox")).toHaveTextContent("미드필더");
  });

  it("supports keyboard selection (ArrowDown to open/move, Enter to choose)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    screen.getByRole("combobox").focus();
    await user.keyboard("{ArrowDown}"); // opens, active = current (골키퍼)
    await user.keyboard("{ArrowDown}"); // active -> 수비수
    await user.keyboard("{Enter}"); // choose 수비수

    expect(onChange).toHaveBeenCalledWith("df");
    expect(screen.getByRole("combobox")).toHaveTextContent("수비수");
  });

  it("marks the selected option with aria-selected", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("option", { name: "골키퍼" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
