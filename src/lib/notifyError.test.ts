import { describe, it, expect, vi } from "vitest";
import { notifyError } from "./notifyError";
import { ApiError } from "../core/api/client";

// Spies are restored globally via `restoreMocks: true` (vitest.config.ts).
describe("notifyError", () => {
  it("alerts the ApiError message for a normal failure", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    notifyError("삭제 실패")(new ApiError("권한이 없습니다.", 403));
    expect(alertSpy).toHaveBeenCalledWith("권한이 없습니다.");
  });

  it("stays silent on 401 (global logout already handles it)", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    notifyError("삭제 실패")(new ApiError("인증이 만료되었습니다.", 401));
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("falls back to the provided message for a non-ApiError", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    notifyError("삭제 실패")(new Error("boom"));
    expect(alertSpy).toHaveBeenCalledWith("삭제 실패");
  });
});
