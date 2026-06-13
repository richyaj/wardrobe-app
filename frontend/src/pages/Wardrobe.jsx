import { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import styles from './Wardrobe.module.css';

const TYPES = ['all','shirt','tee','hoodie','bottom'];
const TYPE_LABELS = { all:'All', shirt:'Shirts', tee:'T-shirts', hoodie:'Hoodies', bottom:'Bottoms' };
const BADGE_LABELS = { shirt:'Shirt', tee:'Tee', hoodie:'Hoodie', bottom:'Bottom' };

export default function Wardrobe() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:'', type:'shirt', color:'' });
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [viewer, setViewer] = useState(null); // { item }
  const fileRef = useRef();

  useEffect(() => {
    api.get('/api/wardrobe').then(r => setItems(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  const openModal = () => {
    setForm({ name:'', type:'shirt', color:'' });
    setImgFile(null); setImgPreview(null); setError('');
    setModal(true);
  };

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
  };

  const handleAdd = async e => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('type', form.type);
      fd.append('color', form.color);
      if (imgFile) fd.append('image', imgFile);
      const r = await api.post('/api/wardrobe', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      setItems(prev => [r.data, ...prev]);
      setModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add item');
    } finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!confirm('Remove this item?')) return;
    await api.delete(`/api/wardrobe/${id}`);
    setItems(prev => prev.filter(i => i.id !== id));
    if (viewer?.item.id === id) setViewer(null);
  };

  const openViewer = item => setViewer({ item });

  const handleRotate = async (dir) => {
    const item = viewer.item;
    const current = item.rotation ?? 0;
    const next = ((current + dir) + 360) % 360;
    const updated = { ...item, rotation: next };
    setViewer({ item: updated });
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    await api.patch(`/api/wardrobe/${item.id}`, { rotation: next });
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My wardrobe</h1>
          <p className={styles.sub}>{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>+ Add item</button>
      </div>

      <div className={styles.filters}>
        {TYPES.map(t => (
          <button key={t} className={`${styles.chip} ${filter===t ? styles.chipActive : ''}`} onClick={() => setFilter(t)}>
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👕</div>
          <div className="empty-title">No items here</div>
          <div>Add your first clothing item</div>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(item => (
            <div key={item.id} className={styles.card}>
              {item.image_url
                ? (
                  <div className={styles.cardImgWrap} onClick={() => openViewer(item)}>
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className={styles.cardImg}
                      style={{ transform: `rotate(${item.rotation ?? 0}deg)` }}
                    />
                    <div className={styles.rotateHint}>tap to rotate</div>
                  </div>
                )
                : <div className={styles.cardPlaceholder}>👕</div>
              }
              <button className={styles.deleteBtn} onClick={() => handleDelete(item.id)}>✕</button>
              <div className={styles.cardBody}>
                <span className={`badge badge-${item.type}`}>{BADGE_LABELS[item.type]}</span>
                <div className={styles.cardName}>{item.name}</div>
                {item.color && <div className={styles.cardColor}>{item.color}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image viewer with rotation */}
      {viewer && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setViewer(null)}>
          <div className={styles.viewerModal}>
            <div className={styles.viewerHeader}>
              <span className={styles.viewerName}>{viewer.item.name}</span>
              <button className={styles.viewerClose} onClick={() => setViewer(null)}>✕</button>
            </div>
            <div className={styles.viewerImgWrap}>
              <img
                src={viewer.item.image_url}
                alt={viewer.item.name}
                className={styles.viewerImg}
                style={{ transform: `rotate(${viewer.item.rotation ?? 0}deg)` }}
              />
            </div>
            <div className={styles.viewerActions}>
              <button className={styles.rotateBtn} onClick={() => handleRotate(-90)} title="Rotate left">↺</button>
              <span className={styles.rotateLabel}>{viewer.item.rotation ?? 0}°</span>
              <button className={styles.rotateBtn} onClick={() => handleRotate(90)} title="Rotate right">↻</button>
            </div>
            <div className={styles.viewerFooter}>
              <button className={styles.deleteBtnViewer} onClick={() => handleDelete(viewer.item.id)}>Remove item</button>
            </div>
          </div>
        </div>
      )}

      {/* Add item modal */}
      {modal && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Add clothing item</h2>
            {error && <div className={styles.formError}>{error}</div>}
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Navy check shirt" required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>
                  <option value="shirt">Shirt (button-up)</option>
                  <option value="tee">T-shirt / long sleeve</option>
                  <option value="hoodie">Hoodie / sweatshirt</option>
                  <option value="bottom">Bottom (jeans / trousers / chinos)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Colour / description</label>
                <input className="form-input" value={form.color} onChange={e => setForm(f=>({...f,color:e.target.value}))} placeholder="e.g. Dark navy, slim fit" />
              </div>
              <div className="form-group">
                <label className="form-label">Photo (optional)</label>
                <div className={styles.uploadArea} onClick={() => fileRef.current.click()}>
                  {imgPreview
                    ? <img src={imgPreview} alt="preview" className={styles.uploadPreview} />
                    : <><div className={styles.uploadIcon}>📷</div><div>Tap to add photo</div></>
                  }
                </div>
                <input type="file" ref={fileRef} accept="image/*" style={{display:'none'}} onChange={handleFile} />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Adding…</> : 'Add to wardrobe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
