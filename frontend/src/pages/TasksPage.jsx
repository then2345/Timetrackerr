import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { task as taskApi } from '../services/api.js'
import styles from './TasksPage.module.css'

const COLORS = ['#4361EE', '#06D6A0', '#EF476F', '#FFD166', '#118AB2', '#073B4C', '#8338EC', '#FB5607']

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

// >>> MÃ MỚI: Cấu hình danh sách các mốc thời gian chuẩn hóa (Value lưu dạng số phút) <<<
const ESTIMATE_OPTIONS = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m' },
  { value: 60, label: '1h 00m' },
  { value: 90, label: '1h 30m' },
  { value: 120, label: '2h 00m' },
  { value: 150, label: '2h 30m' },
  { value: 180, label: '3h 00m' },
  { value: 240, label: '4h 00m' }
]
// >>> HẾT MÃ MỚI <<<

export default function TasksPage() {
  const { token } = useAuth()
  const [tasks, setTasks] = useState([])        
  const [showForm, setShowForm] = useState(false) 
  const [editTask, setEditTask] = useState(null)  

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0].key)
  
  // >>> MÃ MỚI: Khởi tạo state cho estimateTime (Mặc định chọn 30 phút) <<<
  const [estimateTime, setEstimateTime] = useState(ESTIMATE_OPTIONS[1].value)
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
    setCategory(CATEGORIES[0].key)
    
    // >>> MÃ MỚI: Reset trường thời gian về mặc định khi bấm Add <<<
    setEstimateTime(ESTIMATE_OPTIONS[1].value)
    // >>> HẾT MÃ MỚI <<<
    
    setColor(COLORS[0])
    setShowForm(true)
  }

  function openEdit(t) {
    setEditTask(t)             
    setTitle(t.title)
    setDescription(t.description || '')
    setCategory(t.category || CATEGORIES[0].key)
    
    // >>> MÃ MỚI: Đổ dữ liệu thời gian cũ vào form khi bấm Sửa (Nếu chưa có thì lấy mặc định) <<<
    setEstimateTime(t.estimateTime || ESTIMATE_OPTIONS[1].value)
    // >>> HẾT MÃ MỚI <<<
    
    setColor(t.color)
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!title.trim()) return
    
    // Đóng gói dữ liệu bao gồm cả trường estimateTime mới
    const payload = { 
      title, 
      description, 
      category, 
      estimateTime: Number(estimateTime), // Đảm bảo luôn gửi dạng số
      color 
    }

    if (editTask) {
      await taskApi.update(token, editTask.id, payload)
    } else {
      await taskApi.create(token, payload)
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
      <div className={styles.header}>
        <h2>Work</h2>
        <button className={styles.addBtn} onClick={openAdd}>+ Add</button>
      </div>

      {/* Form Tạo Mới Task */}
      {showForm && !editTask && (
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
          <div className={styles.field}>
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={styles.selectInput}>
              {CATEGORIES.map(cat => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
          </div>
          
          {/* >>> MÃ MỚI: Thêm dropdown Thời lượng vào Form Tạo mới <<< */}
          <div className={styles.field}>
            <label>Estimate Time</label>
            <select value={estimateTime} onChange={e => setEstimateTime(e.target.value)} className={styles.selectInput}>
              {ESTIMATE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                  style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.saveBtn}>Save</button>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Danh sách công việc */}
      <ul className={styles.taskList}>
        {tasks.map(t => {
          const isEditingThisTask = showForm && editTask && editTask.id === t.id;
          
          {/* Form Sửa Task trực tiếp trên dòng */}
          if (isEditingThisTask) {
            return (
              <li key={t.id} className={`${styles.taskCard} ${styles.editingCard}`} style={{ borderLeft: `5px solid ${color}` }}>
                <form onSubmit={handleSave}>
                  <div className={styles.field}>
                    <label>Name</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                  </div>
                  <div className={styles.field}>
                    <label>Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
                  </div>
                  <div className={styles.field}>
                    <label>Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className={styles.selectInput}>
                      {CATEGORIES.map(cat => (
                        <option key={cat.key} value={cat.key}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* >>> MÃ MỚI: Thêm dropdown Thời lượng vào Form Chỉnh sửa <<< */}
                  <div className={styles.field}>
                    <label>Estimate Time</label>
                    <select value={estimateTime} onChange={e => setEstimateTime(e.target.value)} className={styles.selectInput}>
                      {ESTIMATE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                          style={{ background: c }} onClick={() => setColor(c)} />
                      ))}
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveBtn}>Save</button>
                    <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                  </div>
                </form>
              </li>
            )
          }

          {/* Trạng thái hiển thị Card Task bình thường */}
          return (
            <li key={t.id} className={styles.taskCard}>
              <span className={styles.dot} style={{ background: t.color }} />
              <div className={styles.taskInfo}>
                <span className={styles.taskTitle}>{t.title}</span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {t.category && <span className={styles.taskCategory}>{t.category}</span>}
                  
                  {/* >>> MÃ MỚI: Hiển thị nhãn thời lượng dựa trên số phút lưu trong task <<< */}
                  {t.estimateTime && (
                    <span className={styles.taskEstimate} style={{ fontSize: '0.85em', color: '#666' }}>
                      ⏱️ {ESTIMATE_OPTIONS.find(o => o.value === t.estimateTime)?.label || `${t.estimateTime}m`}
                    </span>
                  )}
                  {/* >>> HẾT MÃ MỚI <<< */}
                </div>
                {t.description && <span className={styles.taskDesc} style={{ marginTop: '4px', display: 'block' }}>{t.description}</span>}
              </div>
              <div className={styles.taskActions}>
                <button onClick={() => openEdit(t)} className={styles.editBtn}>Sửa</button>
                <button onClick={() => handleDelete(t.id)} className={styles.deleteBtn}>Xóa</button>
              </div>
            </li>
          )
        })}
        {tasks.length === 0 && <p className={styles.empty}>There are no jobs yet. Click "Add New" to begin.</p>}
      </ul>
    </div>
  )
}