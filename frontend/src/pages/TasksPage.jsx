import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { task as taskApi } from '../services/api.js'
import styles from './TasksPage.module.css'

const COLORS = ['#4361EE', '#06D6A0', '#EF476F', '#FFD166', '#118AB2', '#073B4C', '#8338EC', '#FB5607']

// >>> MÃ MỚI THÊM Ở ĐÂY: Khai báo danh sách các Category danh mục <<<
const CATEGORIES = [
  { key: 'STUDY', label: 'Study' },
  { key: 'WORK', label: 'Work' },
  { key: 'READING', label: 'Reading' },
  { key: 'SOCIAL', label: 'Social' },
  { key: 'ENTERAINMENT', label: 'Entertainment' },
  { key: 'EXERCISE', label: 'Exercise' },
  { key: 'REST', label: 'Rest' },
  { key: 'OTHERS', label: 'Others' }
]
// >>> HẾT MÃ MỚI <<<

export default function TasksPage() {
  const { token } = useAuth()
  const [tasks, setTasks] = useState([])        
  const [showForm, setShowForm] = useState(false) 
  const [editTask, setEditTask] = useState(null)  

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  // >>> MÃ MỚI THÊM Ở ĐÂY: Khởi tạo state cho category (mặc định chọn STUDY) <<<
  const [category, setCategory] = useState(CATEGORIES[0].key)
  // >>> HẾT MÃ MỚI <<<
  const [color, setColor] = useState(COLORS[0])

  useEffect(() => { loadTasks() }, [token])

  async function loadTasks() {
    const list = await taskApi.list(token)
    setTasks(list)
  }

  function openAdd() {
    setEditTask(null)          
    setTitle('')
    setDescription('')
    // >>> MÃ MỚI THÊM Ở ĐÂY: Reset category về mặc định khi bấm nút Add <<<
    setCategory(CATEGORIES[0].key)
    // >>> HẾT MÃ MỚI <<<
    setColor(COLORS[0])
    setShowForm(true)
  }

  function openEdit(t) {
    setEditTask(t)             
    setTitle(t.title)
    setDescription(t.description || '')
    // >>> MÃ MỚI THÊM Ở ĐÂY: Đổ dữ liệu category cũ vào form khi bấm Sửa <<<
    setCategory(t.category || CATEGORIES[0].key)
    // >>> HẾT MÃ MỚI <<<
    setColor(t.color)
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!title.trim()) return
    if (editTask) {
      // >>> MÃ CHỈNH SỬA: Đã thêm `category` vào payload gửi lên API cập nhật <<<
      await taskApi.update(token, editTask.id, { title, description, category, color })
      // >>> HẾT MÃ CHỈNH SỬA <<<
    } else {
      // >>> MÃ CHỈNH SỬA: Đã thêm `category` vào payload gửi lên API tạo mới <<<
      await taskApi.create(token, { title, description, category, color })
      // >>> HẾT MÃ CHỈNH SỬA <<<
    }
    setShowForm(false)
    loadTasks() 
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure to delete?')) return
    await taskApi.delete(token, id)
    loadTasks()
  }

  return (
    <div className={styles.page}>
      {/* Tiêu đề + nút tạo mới */}
      <div className={styles.header}>
        <h2>Work</h2>
        <button className={styles.addBtn} onClick={openAdd}>+ Add</button>
      </div>

      {/* Form thêm/sửa công việc */}
      {showForm && (
        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.field}>
            <label>Name</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Learn React" required />
          </div>
          <div className={styles.field}>
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Description" rows={2} />
          </div>

          {/* >>> MÃ MỚI THÊM Ở ĐÂY: Thêm khối Dropdown chọn Category nằm giữa Description và Color <<< */}
          <div className={styles.field}>
            <label>Category</label>
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              className={styles.selectInput} 
            >
              {CATEGORIES.map(cat => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          {/* >>> HẾT MÃ MỚI <<< */}

          <div className={styles.field}>
            <label>Color</label>
            <div className={styles.colorPicker}>
              {COLORS.map(c => (
                <button key={c} type="button"
                  className={`${styles.colorDot} ${c === color ? styles.selected : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.saveBtn}>Save</button>
            <button type="button" className={styles.cancelBtn}
              onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Danh sách công việc */}
      <ul className={styles.taskList}>
        {tasks.map(t => (
          <li key={t.id} className={styles.taskCard}>
            {/* Chấm tròn màu công việc */}
            <span className={styles.dot} style={{ background: t.color }} />
            {/* Thông tin công việc */}
            <div className={styles.taskInfo}>
              <span className={styles.taskTitle}>{t.title}</span>
              
              {/* >>> MÃ MỚI THÊM Ở ĐÂY: Hiển thị tag danh mục nhỏ bên cạnh hoặc dưới tiêu đề task <<< */}
              {t.category && <span className={styles.taskCategory}>{t.category}</span>}
              {/* >>> HẾT MÃ MỚI <<< */}

              {t.description && <span className={styles.taskDesc}>{t.description}</span>}
            </div>
            {/* Nút hành động */}
            <div className={styles.taskActions}>
              <button onClick={() => openEdit(t)} className={styles.editBtn}>Sửa</button>
              <button onClick={() => handleDelete(t.id)} className={styles.deleteBtn}>Xóa</button>
            </div>
          </li>
        ))}
        {tasks.length === 0 && <p className={styles.empty}>There are no jobs yet. Click "Add New" to begin.</p>}
      </ul>
    </div>
  )
}