import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TextField from "./TextField";

describe("TextField", () => {
  it("associates the label with the input", () => {
    render(<TextField label="이름" value="" onChange={() => {}} />);
    // getByLabelText only succeeds when label htmlFor matches the input id.
    expect(screen.getByLabelText("이름")).toBeInstanceOf(HTMLInputElement);
  });

  it("forwards arbitrary input props", () => {
    render(
      <TextField
        label="등번호"
        type="number"
        placeholder="7"
        value=""
        onChange={() => {}}
      />,
    );
    const input = screen.getByLabelText("등번호");
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("placeholder", "7");
  });

  it("renders the error message and marks the input invalid", () => {
    render(
      <TextField label="이름" value="" onChange={() => {}} error="필수 항목" />,
    );
    expect(screen.getByText("필수 항목")).toBeInTheDocument();
    expect(screen.getByLabelText("이름")).toHaveAttribute("aria-invalid", "true");
  });

  it("has no aria-invalid when there is no error", () => {
    render(<TextField label="이름" value="" onChange={() => {}} />);
    expect(screen.getByLabelText("이름")).not.toHaveAttribute("aria-invalid");
  });
});
