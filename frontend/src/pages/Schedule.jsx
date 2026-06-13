import { useState, useEffect } from 'react';
import api from '../api/client';
import styles from './Schedule.module.css';

export default function Schedule() {
  const [schedule, setSchedule] = useState(null);
  const [wardrobe, setWardrobe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/schedule'),
      api.get('/api/wardrobe')
    ]).then(([s, w]) => {
      setSchedule(s.data);
      setWardrobe(w.data);
    }).finally(() => setLoading(false));
  }, []);

  const itemMap = Object.fromEntries(wardrobe.map(i => [i.id, i]));

  const generate = async () => {
    setGenerating(true); setError('');
    try {
      const r = await api.post('/api/schedule/generate');
      setSchedule(r.data);
      setActiveWeek(0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate schedule');
    } finally { setGenerating(false); }
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
        <button className="btn btn-primary" onClick={generate} disabled={generating}>
          {generating ? <><span className="spinner" /> Generating…</> : '✦ Generate schedule'}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {!schedule ? (
        <div className="empty-state">
          <div className="empty-icon">🗓</div>
          <div className="empty-title">No schedule yet</div>
          <div>Add your clothes then click "Generate schedule"</div>
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
                    ? <img src={top.image_url} alt={top?.name} className={styles.cardImg} />
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
    </div>
  );
}
