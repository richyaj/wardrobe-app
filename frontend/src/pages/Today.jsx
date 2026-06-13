import { useState, useEffect } from 'react';
import api from '../api/client';
import styles from './Today.module.css';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function workDaysElapsed(startDateStr, today) {
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);
  if (start > end) return -1;
  let count = 0;
  const d = new Date(start);
  while (d < end) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

function getOutfitAt(schedule, startWeekIdx, workDayOffset) {
  if (!schedule || workDayOffset < 0) return null;
  const totalDay = startWeekIdx * 5 + workDayOffset;
  const totalScheduleDays = schedule.reduce((sum, w) => sum + w.days.length, 0);
  const pos = totalDay % totalScheduleDays;
  let remaining = pos;
  for (const week of schedule) {
    if (remaining < week.days.length) return { week, day: week.days[remaining] };
    remaining -= week.days.length;
  }
  return null;
}

function addWorkDays(startDateStr, workDays, offsetDelta) {
  const d = new Date(startDateStr);
  d.setHours(0, 0, 0, 0);
  // move d forward by workDays elapsed first
  let elapsed = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // re-derive today's position
  const base = new Date(d);
  while (base < today) {
    base.setDate(base.getDate() + 1);
    if (base.getDay() !== 0 && base.getDay() !== 6) elapsed++;
  }
  // now offset by delta
  let delta = offsetDelta;
  const result = new Date(today);
  while (delta !== 0) {
    result.setDate(result.getDate() + (delta > 0 ? 1 : -1));
    if (result.getDay() !== 0 && result.getDay() !== 6) delta += delta > 0 ? -1 : 1;
  }
  return result;
}

export default function Today() {
  const [schedule, setSchedule] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [startWeekIdx, setStartWeekIdx] = useState(0);
  const [wardrobe, setWardrobe] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/api/schedule'), api.get('/api/wardrobe')]).then(([s, w]) => {
      setSchedule(s.data.schedule);
      setStartDate(s.data.startDate);
      setStartWeekIdx(s.data.startWeekIdx ?? 0);
      setWardrobe(w.data);
    }).finally(() => setLoading(false));
  }, []);

  const itemMap = Object.fromEntries(wardrobe.map(i => [i.id, i]));
  const today = new Date();
  const dow = today.getDay();
  const isWeekend = dow === 0 || dow === 6;

  const todayStr = today.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });

  if (loading) return <div className="empty-state"><span className="spinner" /></div>;

  if (!schedule) return (
    <div className="empty-state">
      <div className="empty-icon">🗓</div>
      <div className="empty-title">No schedule yet</div>
      <div>Go to Schedule and generate one first</div>
    </div>
  );

  if (!startDate) return (
    <div className="empty-state">
      <div className="empty-icon">▶</div>
      <div className="empty-title">Schedule not started</div>
      <div>Go to Schedule and click <strong>Start schedule</strong> to begin tracking</div>
    </div>
  );

  const todayElapsed = workDaysElapsed(startDate, today);
  const prevDate = addWorkDays(startDate, todayElapsed, -1);
  const nextDate = addWorkDays(startDate, todayElapsed, 1);
  const prevElapsed = workDaysElapsed(startDate, prevDate);
  const nextElapsed = workDaysElapsed(startDate, nextDate) + (nextDate > today ? 1 : 0);

  const todayOutfit = isWeekend ? null : getOutfitAt(schedule, startWeekIdx, todayElapsed);
  const prevOutfit = getOutfitAt(schedule, startWeekIdx, prevElapsed < 0 ? 0 : prevElapsed);
  // For next, count one more work day ahead
  const nextDayOffset = todayElapsed + 1;
  const nextOutfit = getOutfitAt(schedule, startWeekIdx, nextDayOffset);

  const renderCard = (outfit, label, isMain) => {
    if (!outfit) return null;
    const top = itemMap[outfit.day.topId];
    const bot = itemMap[outfit.day.bottomId];
    return (
      <div className={isMain ? styles.mainCard : styles.sideCard}>
        <div className={styles.cardLabel}>{label}</div>
        {top?.image_url
          ? <div className={styles.imgWrap}><img src={top.image_url} alt={top.name} className={styles.img} style={{ transform: `rotate(${top.rotation ?? 0}deg)` }} /></div>
          : <div className={styles.imgPlaceholder}>👕</div>
        }
        <div className={styles.cardInfo}>
          <div className={styles.cardName}>{top?.name || '—'}</div>
          <div className={styles.cardBot}>↳ {bot?.name || '—'}</div>
          <div className={styles.cardWeek}>Week {outfit.week.weekNum} · {outfit.day.day}</div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Today</h1>
        <p className={styles.date}>{todayStr}</p>
      </div>

      {isWeekend ? (
        <div className={styles.weekend}>
          <div className={styles.weekendIcon}>🌿</div>
          <div className={styles.weekendTitle}>Enjoy your weekend!</div>
          <div className={styles.weekendSub}>Next outfit coming Monday</div>
          {nextOutfit && (
            <div className={styles.previewWrap}>
              {renderCard(nextOutfit, 'Monday', false)}
            </div>
          )}
        </div>
      ) : (
        <>
          {todayOutfit
            ? renderCard(todayOutfit, "Today's outfit", true)
            : <div className="empty-state"><div>No outfit found for today</div></div>
          }
          <div className={styles.navRow}>
            <div className={styles.navItem}>
              {prevElapsed >= 0 && renderCard(prevOutfit, `← ${DAY_NAMES[prevDate.getDay()]}`, false)}
            </div>
            <div className={styles.navItem}>
              {renderCard(nextOutfit, `${DAY_NAMES[nextDate.getDay()]} →`, false)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
