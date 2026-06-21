import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTimer } from '../hooks/useTimer.js'
import { task, timeEntry } from '../services/api.js'
import { formatTime, formatDuration, todayDate, nowDateTime } from '../utils/format-time.js'
import styles from './TimerPage.module.css'

const COLORS = ['#4361EE', '#06D6A0', '#EF476F', '#FFD166', '#118AB2', '#073B4C', '#8338EC', '#FB5607']

// --- DATA CẤU HÌNH MẪU CHO CATEGORY VÀ ESTIMATE ---
const CATEGORIES = ['Study', 'Work', 'Life', 'Exercise', 'Other']
const ESTIMATES = ['15m', '30m', '45m', '1h 00m','1h 30m','2h 00m','2h 30m','3h 00m','4h 00m']

export default function TimerPage() {
  const { token } = useAuth()   
  const timer = useTimer()       

  const [tasks, setTasks] = useState([])          
  const [selectedTaskId, setSelectedTaskId] = useState('') 
  const [activeEntryId, setActiveEntryId] = useState(null) 
  const [todayEntries, setTodayEntries] = useState([])     
  const [starting, setStarting] = useState(false)           
  const [showQuickForm, setShowQuickForm] = useState(false) 
  
  // --- CÁC STATE CỦA QUICK FORM ---
  const [quickTitle, setQuickTitle] = useState('')          
  const [quickColor, setQuickColor] = useState(COLORS[0])   
  const [quickCategory, setQuickCategory] = useState(CATEGORIES[0]) // Mặc định là 'Study'
  const [quickEstimate, setQuickEstimate] = useState(ESTIMATES[1])  // Mặc định là '30m'
  
  // State quản lý xem popover nào đang mở ('color' | 'category' | 'time' | null)
  const [activePopup, setActivePopup] = useState(null) 

  // --- CÁC STATE VÀ REF CHO BỘ TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [token])

  // Xử lý đóng dropdown tìm kiếm VÀ các tag popover khi click ra ngoài vùng chọn
  useEffect(() => {
    function handleClickOutside(event) {
      // Đóng dropdown tìm kiếm task
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
        const currentTask = tasks.find(t => t.id === selectedTaskId)
        setSearchTerm(currentTask ? currentTask.title : '')
      }

      // Đóng các popover của Quick Form nếu click ra ngoài khu vực tag
      if (!event.target.closest(`.${styles.inlinePopupContainer}`)) {
        setActivePopup(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedTaskId, tasks])

  async function loadData() {
    const [taskList, entries] = await Promise.all([
      task.list(token),
      timeEntry.list(token, todayDate())
    ])
    setTasks(taskList)
    setTodayEntries(entries)

    // Thay đoạn xử lý "active" trong hàm loadData() bằng đoạn này:
    const active = entries.find(e => !e.end_time)
    if (active) {
      const entryDate = active.start_time.slice(0, 10)
      if (entryDate === todayDate()) {
        // 1. Tính thời gian phiên hiện tại đang chạy
        const [h, m, s] = active.start_time.slice(11, 19).split(':').map(Number)
        const startMs = new Date().setHours(h, m, s, 0)
        const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000))
        
        // 2. Tính tổng các phiên ĐÃ DỪNG trước đó của task này
        const totalToday = calculateTotalSecondsForTask(active.task_id, entries.filter(e => e.id !== active.id));
        
        // 3. Đếm tổng = (phiên đang chạy) + (các phiên đã dừng)
        timer.start(totalToday + elapsed)
        
        setActiveEntryId(active.id)
        setSelectedTaskId(active.task_id || '')
        const activeTask = tasks.find(t => t.id === active.task_id)
        if (activeTask) setSearchTerm(activeTask.title)
      }
      // ... phần còn lại giữ nguyên
    }
  }

  // Gửi kèm đầy đủ data Category và Estimate lên API khi tạo
  async function handleQuickCreate(e) {
    e.preventDefault()
    if (!quickTitle.trim()) return
    
    const newTask = await task.create(token, { 
      title: quickTitle, 
      color: quickColor,
      category: quickCategory,
      estimate_time: quickEstimate
    })
    
    setTasks(prev => [...prev, newTask]) 
    setSelectedTaskId(newTask.id)        
    setSearchTerm(newTask.title) 
    
    // Reset form về trạng thái mặc định ban đầu
    setQuickTitle('')
    setQuickColor(COLORS[0])
    setQuickCategory(CATEGORIES[0])
    setQuickEstimate(ESTIMATES[1])
    setShowQuickForm(false)
    setActivePopup(null)
  }

  const calculateTotalSecondsForTask = (taskId, entries) => {
    return entries
      .filter(e => e.task_id === taskId && e.end_time) // Chỉ tính các phiên đã dừng
      .reduce((sum, e) => sum + (e.duration || 0), 0);
  };

  async function handleStart() {
  if (!selectedTaskId) return
  setStarting(true)
  try {
    const entry = await timeEntry.create(token, {
      task_id: selectedTaskId,
      start_time: nowDateTime(),
      date: todayDate()
    })
    
    // Tính tổng thời gian đã làm trước đó trong ngày
    const totalToday = calculateTotalSecondsForTask(selectedTaskId, todayEntries);

    setActiveEntryId(entry.id)
    timer.start(totalToday) // Bắt đầu đếm tiếp từ tổng cũ
  } catch (err) {
    if (err.status === 409) alert('Bạn đã có bản ghi đang chạy')
  } finally {
    setStarting(false)
  }
  }
  async function handleStop() {
    if (!activeEntryId) return
    await timeEntry.update(token, activeEntryId, { end_time: nowDateTime() })
    timer.stop()
    timer.reset()
    setActiveEntryId(null)
    const entries = await timeEntry.list(token, todayDate())
    setTodayEntries(entries)
  }

  async function handleContinue(entryId) {
  try {
    const entry = await timeEntry.continue(token, entryId)
    
    // Tính tổng thời gian đã làm của task này trong ngày
    const totalToday = calculateTotalSecondsForTask(entry.task_id, todayEntries);

    setActiveEntryId(entry.id)
    setSelectedTaskId(entry.task_id)
    setSearchTerm(getTaskTitle(entry.task_id))
    
    timer.start(totalToday) // Bắt đầu đếm tiếp từ tổng cũ
  } catch (err) {
    if (err.status === 409) alert('Bạn đang có phiên khác chạy')
    else alert('Có lỗi xảy ra')
  }
  }

  const getTaskTitle = (taskId) => tasks.find(t => t.id === taskId)?.title || 'Không rõ'
  const getTaskColor = (taskId) => tasks.find(t => t.id === taskId)?.color || '#6C757D'

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={styles.page}>
      <div className={styles.timerSection}>
        
        <div className={styles.taskRow}>
          <div className={styles.searchContainer} ref={dropdownRef}>
            <input
              type="text"
              className={styles.taskInput}
              placeholder="Enter taskname"
              value={searchTerm}
              disabled={timer.isRunning}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                if (e.target.value === '') {
                  setSelectedTaskId('') 
                }
                setShowDropdown(true)
              }}
              autoComplete="off"
            />
            <span className={styles.arrowDown}>▼</span>

            {showDropdown && !timer.isRunning && (
              <ul className={styles.dropdownList}>
                {filteredTasks.length === 0 ? (
                  <li className={styles.noResult}>No task found</li>
                ) : (
                  filteredTasks.map(t => (
                    <li 
                      key={t.id} 
                      onClick={() => {
                        setSelectedTaskId(t.id)
                        setSearchTerm(t.title)
                        setShowDropdown(false)
                      }}
                    >
                      {t.title}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {!timer.isRunning && (
            <button className={styles.quickBtn} onClick={() => setShowQuickForm(f => !f)}>
              {showQuickForm ? 'X' : '+'}
            </button>
          )}
        </div>

        {/* --- FORM TẠO NHANH PHIÊN BẢN INLINE BADGES MỚI --- */}
        {showQuickForm && (
          <form className={styles.quickForm} onSubmit={handleQuickCreate}>
            <input
              type="text"
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
              placeholder="New task..."
              className={styles.quickInput}
              required
            />
            
            {/* Hàng chứa các tag cấu hình nhanh */}
            <div className={styles.tagRow}>
              
              {/* Tag 1: Chọn màu sắc (Gom 8 nút thành 1 nút Popover tròn) */}
              <div className={styles.inlinePopupContainer}>
                <button
                  type="button"
                  className={styles.colorTrigger}
                  style={{ background: quickColor }}
                  onClick={() => setActivePopup(activePopup === 'color' ? null : 'color')}
                />
                {activePopup === 'color' && (
                  <div className={styles.inlinePopupColors}>
                    {COLORS.map(c => (
                      <button
                        key={c} type="button"
                        className={`${styles.colorDot} ${c === quickColor ? styles.colorSelected : ''}`}
                        style={{ background: c }}
                        onClick={() => {
                          setQuickColor(c)
                          setActivePopup(null)
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Tag 2: Chọn Danh mục (Category Badge) */}
              <div className={styles.inlinePopupContainer}>
                <button
                  type="button"
                  className={styles.tagBadge}
                  onClick={() => setActivePopup(activePopup === 'category' ? null : 'category')}
                >
                  📁 {quickCategory}
                </button>
                {activePopup === 'category' && (
                  <ul className={styles.inlineMenu}>
                    {CATEGORIES.map(cat => (
                      <li 
                        key={cat}
                        className={cat === quickCategory ? styles.activeOption : ''}
                        onClick={() => {
                          setQuickCategory(cat)
                          setActivePopup(null)
                        }}
                      >
                        {cat}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Tag 3: Chọn Thời gian dự kiến (Estimate Time Badge) */}
              <div className={styles.inlinePopupContainer}>
                <button
                  type="button"
                  className={styles.tagBadge}
                  onClick={() => setActivePopup(activePopup === 'time' ? null : 'time')}
                >
                  ⏱️ {quickEstimate}
                </button>
                {activePopup === 'time' && (
                  <ul className={styles.inlineMenu}>
                    {ESTIMATES.map(est => (
                      <li 
                        key={est}
                        className={est === quickEstimate ? styles.activeOption : ''}
                        onClick={() => {
                          setQuickEstimate(est)
                          setActivePopup(null)
                        }}
                      >
                        {est}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>

            {/* Màu nút chuyển sang xanh dương đồng bộ với Form Chuẩn */}
            <button type="submit" className={styles.quickSave}>Tạo & chọn</button>
          </form>
        )}

        <div className={`${styles.timerDisplay} ${timer.isRunning ? styles.running : ''}`}>
          {formatTime(timer.seconds)}
        </div>

        {timer.isRunning ? (
          <button className={styles.stopBtn} onClick={handleStop}>Dừng lại</button>
        ) : (
          <button className={styles.startBtn} onClick={handleStart}
            disabled={!selectedTaskId || starting}>
            {starting ? 'Start...' : 'Start'}
          </button>
        )}
      </div>

      <div className={styles.logSection}>
        <h3 className={styles.logTitle}>Today</h3>
        {todayEntries.filter(e => e.end_time).length === 0 ? (
          <p className={styles.empty}>No record</p>
        ) : (
          <ul className={styles.logList}>
            {/* --- ĐOẠN GOM NHÓM DỮ LIỆU --- */}
            {Object.values(todayEntries.filter(e => e.end_time).reduce((acc, entry) => {
              if (!acc[entry.task_id]) {
                acc[entry.task_id] = { ...entry, totalDuration: 0 };
              }
              acc[entry.task_id].totalDuration += (entry.duration || 0);
              // Lấy bản ghi mới nhất để khi bấm Continue là lấy đúng cái cuối cùng
              if (new Date(entry.start_time) > new Date(acc[entry.task_id].start_time)) {
                acc[entry.task_id] = { ...entry, totalDuration: acc[entry.task_id].totalDuration };
              }
              return acc;
            }, {})). reverse()
            .map(entry => (
              <li key={entry.id} className={styles.logItem}>
                <span className={styles.dot} style={{ background: getTaskColor(entry.task_id) }} />
                <span className={styles.logTask}>{entry.task_title || getTaskTitle(entry.task_id)}</span>
                
                {/* --- HIỂN THỊ TỔNG THỜI GIAN --- */}
                <span className={styles.logDuration}>
                  {formatDuration(entry.totalDuration)}
                </span>

                <button 
                  style={{ marginLeft: '10px', cursor: 'pointer', border: 'none', background: 'transparent' }}
                  onClick={() => handleContinue(entry.id)}
                  disabled={timer.isRunning}
                  title="Tiếp tục"
                >
                  ▶
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}