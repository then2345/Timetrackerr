import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import pool from '../config/db.js'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM tasks WHERE user_id = ? AND is_active = TRUE ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json(rows)
  } catch {
    res.status(500).json({ error: 'Lỗi server' })
  }
})

router.post('/', async (req, res) => {
  try {
    // >>> MÃ CHỈNH SỬA: Lấy thêm trường estimateTime từ req.body <<<
    const { title, description, category, estimateTime, color } = req.body
    // >>> HẾT MÃ CHỈNH SỬA <<<

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Tên công việc không được để trống' })
    }

    // >>> MÃ CHỈNH SỬA: Thêm cột estimate_time vào câu lệnh INSERT và mảng tham số <<<
    const [result] = await pool.execute(
      'INSERT INTO tasks (user_id, title, description, category, estimate_time, color) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.user.id, 
        title.trim(), 
        description?.trim() || null, 
        category || 'STUDY', 
        estimateTime || 30, // Nếu frontend không gửi lên thì mặc định là 30 phút
        color || '#4361EE'
      ]
    )
    // >>> HẾT MÃ CHỈNH SỬA <<<

    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch {
    res.status(500).json({ error: 'Lỗi server' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    // >>> MÃ CHỈNH SỬA: Lấy thêm trường estimateTime từ req.body để cập nhật <<<
    const { title, description, category, estimateTime, color, is_active } = req.body
    // >>> HẾT MÃ CHỈNH SỬA <<<

    const [existing] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    )
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' })
    }

    // >>> MÃ CHỈNH SỬA: Cập nhật cột estimate_time vào câu lệnh UPDATE và mảng giá trị <<<
    await pool.execute(
      'UPDATE tasks SET title = ?, description = ?, category = ?, estimate_time = ?, color = ?, is_active = ? WHERE id = ?',
      [
        title?.trim() || existing[0].title,
        description ?? existing[0].description,
        category || existing[0].category,
        estimateTime !== undefined ? estimateTime : existing[0].estimate_time, // Giữ nguyên giá trị cũ nếu không truyền lên
        color || existing[0].color,
        is_active !== undefined ? is_active : existing[0].is_active,
        req.params.id,
      ]
    )
    // >>> HẾT MÃ CHỈNH SỬA <<<

    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id])
    res.json(rows[0])
  } catch {
    res.status(500).json({ error: 'Lỗi server' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const [existing] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    )
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' })
    }
    await pool.execute('UPDATE tasks SET is_active = FALSE WHERE id = ?', [req.params.id])
    res.json({ message: 'Đã xóa công việc' })
  } catch {
    res.status(500).json({ error: 'Lỗi server' })
  }
})

export default router