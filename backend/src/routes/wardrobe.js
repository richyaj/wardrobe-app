import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { pool } from '../db/index.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }] },
      (err, result) => err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });
}

// GET all items for user
router.get('/', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM wardrobe_items WHERE user_id=$1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(rows);
});

// POST new item
router.post('/', auth, upload.single('image'), async (req, res) => {
  const { name, type, color } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Name and type required' });
  let image_url = null, image_public_id = null;
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, `wardrobe/${req.user.id}`);
    image_url = result.secure_url;
    image_public_id = result.public_id;
  }
  const { rows } = await pool.query(
    'INSERT INTO wardrobe_items (user_id, name, type, color, image_url, image_public_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [req.user.id, name, type, color || null, image_url, image_public_id]
  );
  res.json(rows[0]);
});

// DELETE item
router.delete('/:id', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM wardrobe_items WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Item not found' });
  if (rows[0].image_public_id) {
    await cloudinary.uploader.destroy(rows[0].image_public_id).catch(() => {});
  }
  await pool.query('DELETE FROM wardrobe_items WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// PATCH update item
router.patch('/:id', auth, upload.single('image'), async (req, res) => {
  const { name, type, color } = req.body;
  const { rows } = await pool.query(
    'SELECT * FROM wardrobe_items WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Item not found' });
  let { image_url, image_public_id } = rows[0];
  if (req.file) {
    if (image_public_id) await cloudinary.uploader.destroy(image_public_id).catch(() => {});
    const result = await uploadToCloudinary(req.file.buffer, `wardrobe/${req.user.id}`);
    image_url = result.secure_url;
    image_public_id = result.public_id;
  }
  const { rows: updated } = await pool.query(
    'UPDATE wardrobe_items SET name=$1, type=$2, color=$3, image_url=$4, image_public_id=$5 WHERE id=$6 RETURNING *',
    [name || rows[0].name, type || rows[0].type, color ?? rows[0].color, image_url, image_public_id, req.params.id]
  );
  res.json(updated[0]);
});

export default router;
