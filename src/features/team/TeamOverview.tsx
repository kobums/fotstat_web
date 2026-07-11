import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar, { type DayMatch } from "../../components/Calendar/Calendar";
import Crest from "../../components/Crest/Crest";
import ResultPill from "../../components/ResultPill/ResultPill";
import {
  birthdayAgeOn,
  birthdayMonthDays,
  birthdayPlayersOn,
} from "../../lib/birthday";
import {
  formatMatchDate,
  formatMatchTime,
  isUpcoming,
  parseMatchDate,
  toDayKey,
} from "../../lib/date";
import { useMatches } from "../match/useMatches";
import { useMatchResults } from "../match/useMatchResults";
import MatchRowList from "../match/MatchRowList";
import { usePlayers } from "../player/usePlayers";
import InjuriesSection from "./InjuriesSection";
import { useTeamContext } from "./teamContext";
import { useTrainings } from "./useTrainings";
import styles from "./TeamOverview.module.css";

export default function TeamOverview() {
  const { team } = useTeamContext();
  const navigate = useNavigate();
  const { data: matches } = useMatches(team.id);
  const { results } = useMatchResults(team.id);
  const { data: players } = usePlayers(team.id);
  const { data: trainings } = useTrainings(team.id);
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

  // 지난(날짜가 과거인) 경기만 — "최근 경기"·"완료" 집계 기준. 예정 경기에
  // 쿼터 데이터가 있어도 여기 포함되면 안 된다("지난 경기" 리스트와 동일 기준).
  const finished = useMemo(
    () => list.filter((m) => !isUpcoming(m.matchdate, now)),
    [list, now],
  );
  const completedCount = finished.length;

  const recent = useMemo(
    () =>
      finished
        .filter((m) => results.get(m.id)?.played)
        .sort(
          (a, b) =>
            (parseMatchDate(b.matchdate)?.getTime() ?? 0) -
            (parseMatchDate(a.matchdate)?.getTime() ?? 0),
        )
        .slice(0, 5),
    [finished, results],
  );

  const dayMatches = useMemo(
    () => (selectedDay ? list.filter((m) => toDayKey(m.matchdate) === selectedDay) : []),
    [list, selectedDay],
  );

  // 훈련 — 캘린더 마커(날짜별 시간 목록)와 선택한 날짜의 훈련 목록
  const trainingList = useMemo(() => trainings ?? [], [trainings]);
  const trainingDays = useMemo(() => {
    const sorted = [...trainingList].sort((a, b) =>
      a.trainingdate.localeCompare(b.trainingdate),
    );
    const map = new Map<string, string[]>();
    for (const t of sorted) {
      const key = toDayKey(t.trainingdate);
      if (!key) continue;
      const entry = map.get(key) ?? [];
      entry.push(formatMatchTime(t.trainingdate));
      map.set(key, entry);
    }
    return map;
  }, [trainingList]);
  const dayTrainings = useMemo(
    () =>
      selectedDay
        ? trainingList
            .filter((t) => toDayKey(t.trainingdate) === selectedDay)
            .sort((a, b) => a.trainingdate.localeCompare(b.trainingdate))
        : [],
    [trainingList, selectedDay],
  );

  const squad = useMemo(() => players ?? [], [players]);
  const birthdayDays = useMemo(() => birthdayMonthDays(squad), [squad]);
  const dayBirthdays = useMemo(
    () => (selectedDay ? birthdayPlayersOn(squad, selectedDay) : []),
    [squad, selectedDay],
  );

  const go = (id: number) => navigate(`/teams/${team.id}/matches/${id}`);

  return (
    <div className={styles.wrap}>
      {/* 섹션 순서는 iOS 홈 탭과 동일:
          요약(최근 5경기 포함) → 일정 → 다음 경기 → 부상자 → 최근 경기 리스트 */}
      <section className={styles.hero}>
        <Crest name={team.name} size={64} />
        <div>
          <h2 className={styles.name}>{team.name}</h2>
          <span className={styles.meta}>
            경기 {list.length} · 예정 {upcoming.length} · 완료 {completedCount}
          </span>
        </div>
        {recent.length > 0 && (
          <div className={styles.heroRecent}>
            <span className={styles.heroRecentLabel}>최근 5경기</span>
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
          </div>
        )}
      </section>

      <section>
        <h3 className={styles.sectionTitle}>일정</h3>
        <Calendar
          marked={marked}
          info={dayInfo}
          trainings={trainingDays}
          birthdays={birthdayDays}
          selected={selectedDay}
          onSelect={setSelectedDay}
        />
        {selectedDay && dayMatches.length > 0 && (
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
        )}
        {selectedDay && dayTrainings.length > 0 && (
          <ul className={styles.dayList}>
            {dayTrainings.map((t) => (
              <li key={t.id}>
                <button
                  className={styles.dayItem}
                  onClick={() => navigate(`/teams/${team.id}/trainings`)}
                >
                  훈련
                  <span className={styles.dayTime}>
                    {formatMatchDate(t.trainingdate)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedDay && dayBirthdays.length > 0 && (
          <ul className={styles.dayList}>
            {dayBirthdays.map((p) => {
              const age = birthdayAgeOn(p.birthdate, selectedDay);
              return (
                <li key={p.id} className={styles.birthdayItem}>
                  🎂 {p.name} 생일
                  {age !== null && (
                    <span className={styles.dayTime}>만 {age}세</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {selectedDay &&
          dayMatches.length === 0 &&
          dayTrainings.length === 0 &&
          dayBirthdays.length === 0 && (
            <p className={styles.dayEmpty}>이 날은 일정이 없습니다.</p>
          )}
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

      <InjuriesSection teamId={team.id} matches={list} />

      {recent.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>최근 경기</h3>
          <MatchRowList matches={recent} results={results} onSelect={go} />
        </section>
      )}
    </div>
  );
}
