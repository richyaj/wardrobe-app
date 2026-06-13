import { useState, useEffect } from 'react';
import api from '../api/client';
import styles from './Schedule.module.css';

export default function Schedule() {
  const [schedule, setSchedule] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [startWeekIdx, setStartWeekIdx] = useState(0);
  const [wardrobe, setWardrobe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);
  const [error, setError] = useState('');
  const [startModal, setStartModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/api/schedule'),
      api.get('/api/wardrobe')
    ]).then(([s, w]) => {
      setSchedule(s.data.schedule);
      setStartDate(s.data.startDate);
      setStartWeekIdx(s.data.startWeekIdx ?? 0);
      setWardrobe(w.data);
    }).finally(() => setLoading(false));
  }, []);

  const itemMap = Object.fromEntries(wardrobe.map(i => [i.id, i]));

  const generate = async () => {
    setGenerating(true); setError('');
    try {
      const r = await api.post('/api/schedule/generate');
      setSchedule(r.data.schedule);
      setStartDate(null);
      setStartWeekIdx(0);
      setActiveWeek(0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate schedule');
    } finally { setGenerating(false); }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const r = await api.patch('/api/schedule/start', { startWeekIdx: selectedWeek });
      setStartDate(r.data.startDate);
      setStartWeekIdx(r.data.startWeekIdx);
      setStartModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start schedule');
    } finally { setStarting(false); }
  };

  if (loading) return <div className="empty-state"><span className="spinner" /></div>;

  const week = schedule?.[activeWeek];
  const isSecondWear = week && schedule.slice(0, activeWeek).some(w =>
    w.days.some(d => week.days.some(wd => wd.topId === d.topId))
  );

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Outfit schedule</h1>
          <p className={styles.sub}>Mon–Fri · each top worn twice then washed</p>
        </div>
        <div className={styles.headerBtns}>
          {schedule && !startDate && (
            <button className="btn" onClick={() => { setSelectedWeek(0); setStartModal(true); }}>
              ▶ Start schedule
            </button>
          )}
          {schedule && startDate && (
            <button className="btn" onClick={() => { setSelectedWeek(startWeekIdx); setStartModal(true); }}>
              ↺ Change start
            </button>
          )}
          <button className="btn btn-primary" onClick={generate} disabled={generating}>
            {generating ? <><span className="spinner" /> Generating…</> : '✦ Generate'}
          </button>
        </div>
      </div>

      {startDate && (
        <div className={styles.startBanner}>
          Schedule started from <strong>Week {startWeekIdx + 1}</strong> on <strong>{new Date(startDate).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</strong> · Check the <a href="/today">Today tab</a> to see what to wear
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {!schedule ? (
        <div className="empty-state">
          <div className="empty-icon">🗓</div>
          <div className="empty-title">No schedule yet</div>
          <div>Add your clothes then click "Generate"</div>
        </div>
      ) : (
        <>
          <div className={styles.weekTabs}>
            {schedule.map((w, i) => (
              <button key={i} className={`${styles.weekTab} ${i === activeWeek ? styles.weekTabActive : ''}`} onClick={() => setActiveWeek(i)}>
                Week {w.weekNum}
              </button>
            ))}
          </div>

          <div className={`${styles.weekNote} ${isSecondWear ? styles.noteSecond : styles.noteFresh}`}>
            {isSecondWear
              ? '🔴 2nd wear this week — wash these after wearing'
              : '🟢 First wear — these tops come back 2 weeks later'}
          </div>

          <div className={styles.grid}>
            {week?.days.map((d, i) => {
              const top = itemMap[d.topId];
              const bot = itemMap[d.bottomId];
              const alreadySeen = schedule.slice(0, activeWeek).some(w => w.days.some(wd => wd.topId === d.topId));
              return (
                <div key={i} className={`${styles.card} ${alreadySeen ? styles.secondWear : ''}`}>
                  {top?.image_url
                    ? <div className={styles.cardImgWrap}><img src={top.image_url} alt={top?.name} className={styles.cardImg} style={{ transform: `rotate(${top.rotation ?? 0}deg)` }} /></div>
                    : <div className={styles.cardPh}>👕</div>
                  }
                  <div className={styles.cardBody}>
                    {alreadySeen && <span className={styles.secondBadge}>2nd wear</span>}
                    <div className={styles.cardDay}>{d.day}</div>
                    <div className={styles.cardName}>{top?.name || 'Unknown item'}</div>
                    <div className={styles.cardBot}>↳ {bot?.name || '—'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {startModal && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setStartModal(false)}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Start schedule</h2>
            <p className={styles.modalSub}>Pick which week to begin from. Today's date will be set as day 1 of that week.</p>
            <div className="form-group">
              <label className="form-label">Starting week</label>
              <select className="form-select" value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))}>
                {schedule.map((w, i) => (
                  <option key={i} value={i}>Week {w.weekNum}</option>
                ))}
              </select>
            </div>
            <div className={styles.modalActions}>
              <button className="btn" onClick={() => setStartModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStart} disabled={starting}>
                {starting ? <><span className="spinner" /> Starting…</> : 'Start'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
