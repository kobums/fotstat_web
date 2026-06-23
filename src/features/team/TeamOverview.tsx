import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar, { type DayMatch } from "../../components/Calendar/Calendar";
import Crest from "../../components/Crest/Crest";
import ResultPill from "../../components/ResultPill/ResultPill";
import {
  formatMatchDate,
  formatMatchTime,
  isUpcoming,
  parseMatchDate,
  toDayKey,
} from "../../lib/date";
import { useMatches } from "../match/useMatches";
import { useMatchResults } from "../match/useMatchResults";
import { useTeamContext } from "./teamContext";
import styles from "./TeamOverview.module.css";

export default function TeamOverview() {
  const { team } = useTeamContext();
  const navigate = useNavigate();
  const { data: matches } = useMatches(team.id);
  const { results } = useMatchResults(team.id);
  const [selectedDay, setSelectedDay] = useState("");

  const now = useMemo(() => new Date(), []);
  const list = useMemo(() => matches ?? [], [matches]);

  const marked = useMemo(
    () => new Set(list.map((m) => toDayKey(m.matchdate)).filter(Boolean)),
    [list],
  );

  const dayInfo = useMemo(() => {
    const sorted = [...list].sort(
      (a, b) =>
        (parseMatchDate(a.matchdate)?.getTime() ?? 0) -
        (parseMatchDate(b.matchdate)?.getTime() ?? 0),
    );
    const map = new Map<string, DayMatch[]>();
    for (const m of sorted) {
      const key = toDayKey(m.matchdate);
      if (!key) continue;
      const entry = map.get(key) ?? [];
      entry.push({ time: formatMatchTime(m.matchdate), away: m.awayname });
      map.set(key, entry);
    }
    return map;
  }, [list]);

  const upcoming = useMemo(
    () =>
      list
        .filter((m) => isUpcoming(m.matchdate, now))
        .sort(
          (a, b) =>
            (parseMatchDate(a.matchdate)?.getTime() ?? 0) -
            (parseMatchDate(b.matchdate)?.getTime() ?? 0),
        ),
    [list, now],
  );
  const nextMatch = upcoming[0];
  const completedCount = results.size;

  const recent = useMemo(
    () =>
      list
        .filter((m) => results.get(m.id)?.played)
        .sort(
          (a, b) =>
            (parseMatchDate(b.matchdate)?.getTime() ?? 0) -
            (parseMatchDate(a.matchdate)?.getTime() ?? 0),
        )
        .slice(0, 5),
    [list, results],
  );

  const dayMatches = useMemo(
    () => (selectedDay ? list.filter((m) => toDayKey(m.matchdate) === selectedDay) : []),
    [list, selectedDay],
  );

  const go = (id: number) => navigate(`/teams/${team.id}/matches/${id}`);

  return (
    <div className={styles.wrap}>
      <section className={styles.hero}>
        <Crest name={team.name} size={64} />
        <div>
          <h2 className={styles.name}>{team.name}</h2>
          <span className={styles.meta}>
            경기 {list.length} · 예정 {upcoming.length} · 완료 {completedCount}
          </span>
        </div>
      </section>

      {nextMatch && (
        <button className={styles.next} onClick={() => go(nextMatch.id)}>
          <span className={styles.nextLabel}>다음 경기</span>
          <span className={styles.nextAway}>vs {nextMatch.awayname}</span>
          <span className={styles.nextDate}>
            {formatMatchDate(nextMatch.matchdate)}
          </span>
        </button>
      )}

      {recent.length > 0 && (
        <section className={styles.recent}>
          <h3 className={styles.sectionTitle}>최근 경기</h3>
          <div className={styles.pills}>
            {recent.map((m) => {
              const r = results.get(m.id)!;
              return (
                <button
                  key={m.id}
                  className={styles.pillRow}
                  onClick={() => go(m.id)}
                  title={`vs ${m.awayname}`}
                >
                  <ResultPill result={r.result} size={22} />
                  <span className={styles.pillScore}>
                    {r.home}:{r.away}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h3 className={styles.sectionTitle}>일정</h3>
        <Calendar
          marked={marked}
          info={dayInfo}
          selected={selectedDay}
          onSelect={setSelectedDay}
        />
        {selectedDay &&
          (dayMatches.length > 0 ? (
            <ul className={styles.dayList}>
              {dayMatches.map((m) => (
                <li key={m.id}>
                  <button className={styles.dayItem} onClick={() => go(m.id)}>
                    vs {m.awayname}
                    <span className={styles.dayTime}>
                      {formatMatchDate(m.matchdate)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.dayEmpty}>이 날은 경기가 없습니다.</p>
          ))}
      </section>
    </div>
  );
}
