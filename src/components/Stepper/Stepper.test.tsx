import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Stepper from "./Stepper";

describe("Stepper", () => {
  it("renders the current value and labelled controls", () => {
    render(<Stepper value={3} onChange={() => {}} label="골" />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "골 증가" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "골 감소" })).toBeInTheDocument();
  });

  it("increments by one", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={5} onChange={onChange} label="골" max={10} />);

    await user.click(screen.getByRole("button", { name: "골 증가" }));
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it("decrements by one", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={5} onChange={onChange} label="골" />);

    await user.click(screen.getByRole("button", { name: "골 감소" }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("clamps at the minimum (decrement disabled)", () => {
    render(<Stepper value={0} onChange={() => {}} label="골" min={0} />);
    expect(screen.getByRole("button", { name: "골 감소" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "골 증가" })).toBeEnabled();
  });

  it("clamps at the maximum (increment disabled)", () => {
    render(<Stepper value={10} onChange={() => {}} label="골" max={10} />);
    expect(screen.getByRole("button", { name: "골 증가" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "골 감소" })).toBeEnabled();
  });
});
