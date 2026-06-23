import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "./Modal";

describe("Modal", () => {
  it("renders nothing when closed", () => {
    render(
      <Modal open={false} title="팀 추가" onClose={() => {}}>
        <p>body</p>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("body")).toBeNull();
  });

  it("renders the title and children when open", () => {
    render(
      <Modal open title="팀 추가" onClose={() => {}}>
        <p>body</p>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog", { name: "팀 추가" });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "팀 추가" }),
    ).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("calls onClose on the close button and on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open title="팀 추가" onClose={onClose}>
        <p>body</p>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("closes on overlay click but not on content click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open title="팀 추가" onClose={onClose}>
        <p>body</p>
      </Modal>,
    );

    // Clicking inside the dialog must not bubble out to close it.
    await user.click(screen.getByText("body"));
    expect(onClose).not.toHaveBeenCalled();

    // The overlay (presentation role) is the click-to-dismiss surface.
    await user.click(screen.getByRole("presentation"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks body scroll while open and restores it on unmount", () => {
    const { unmount } = render(
      <Modal open title="팀 추가" onClose={() => {}}>
        <p>body</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
