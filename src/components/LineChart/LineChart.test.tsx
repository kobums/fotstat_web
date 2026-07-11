import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LineChart from "./LineChart";

describe("LineChart", () => {
  it("빈 데이터면 빈 상태 문구를 보여준다", () => {
    render(<LineChart points={[]} />);
    expect(screen.getByText("측정 데이터가 없습니다")).toBeInTheDocument();
  });

  it("점 1개면 선 없이 점과 라벨만 그린다", () => {
    const { container } = render(
      <LineChart points={[{ date: "2026-06-08", value: 41.5 }]} unit="kg" />,
    );
    expect(container.querySelector("polyline")).toBeNull();
    expect(screen.getByTitle("2026-06-08 · 41.5kg")).toBeInTheDocument();
    // y 라벨은 max/min 둘 다 같은 값
    expect(screen.getAllByText("41.5kg")).toHaveLength(2);
    expect(screen.getByText("6.8")).toBeInTheDocument();
  });

  it("여러 점이면 폴리라인과 첫/끝 날짜 라벨을 그린다", () => {
    const { container } = render(
      <LineChart
        points={[
          { date: "2026-06-01", value: 40 },
          { date: "2026-06-08", value: 41.5 },
          { date: "2026-06-15", value: 41 },
        ]}
        unit="kg"
      />,
    );
    expect(container.querySelector("polyline")).not.toBeNull();
    expect(screen.getByText("6.1")).toBeInTheDocument();
    expect(screen.getByText("6.15")).toBeInTheDocument();
    expect(screen.getByText("41.5kg")).toBeInTheDocument(); // max
    expect(screen.getByText("40kg")).toBeInTheDocument(); // min
  });

  it("모든 값이 같아도(span=0) 그린다 — 중앙 수평선", () => {
    const { container } = render(
      <LineChart
        points={[
          { date: "2026-06-01", value: 50 },
          { date: "2026-06-08", value: 50 },
        ]}
      />,
    );
    const polyline = container.querySelector("polyline");
    expect(polyline?.getAttribute("points")).toContain("50"); // y = VIEW_H/2
  });

  it("접근성 제목을 지표명으로 지정할 수 있다", () => {
    render(
      <LineChart points={[{ date: "2026-06-08", value: 20 }]} title="체지방률 추이" />,
    );
    expect(screen.getByRole("img", { name: "체지방률 추이" })).toBeInTheDocument();
  });
});
