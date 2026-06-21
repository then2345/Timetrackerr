import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTimer } from '../hooks/useTimer.js'
// VỊ TRÍ 1: Đã bổ sung scheduledTask vào hàng import
import { task, timeEntry, scheduledTask } from '../services/api.js'
import { formatTime, formatDuration, todayDate, nowDateTime } from '../utils/format-time.js'
import styles from './TimerPage.module.css'

const COLORS = ['#4361EE', '#06D6A0', '#EF476F', '#FFD166', '#118AB2', '#073B4C', '#8338EC', '#FB5607']
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
  
  const [quickTitle, setQuickTitle] = useState('')          
  const [quickColor, setQuickColor] = useState(COLORS[0])   
  const [quickCategory, setQuickCategory] = useState(CATEGORIES[0]) 
  const [quickEstimate, setQuickEstimate] = useState(ESTIMATES[1])  
  
  const [activePopup, setActivePopup] = useState(null) 

  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // VỊ TRÍ 2: Thêm state lưu lịch trình thực tế từ Database
  const [schedules, setSchedules] = useState([])

  // STATE THEO DÕI THỜI GIAN THỰC ĐỂ TỰ ĐỘNG ĐẢO TASK
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Cập nhật phút hiện tại sau mỗi 30 giây để widget luôn chính xác
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadData()
  }, [token])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
        const currentTask = tasks.find(t => t.id === selectedTaskId)
        setSearchTerm(currentTask ? currentTask.title : '')
      }
      if (!event.target.closest(`.${styles.inlinePopupContainer}`)) {
        setActivePopup(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedTaskId, tasks])

  // VỊ TRÍ 3: Gọi song song cả 3 API (bao gồm cả scheduledTask.list)
  async function loadData() {
    const [taskList, entries, scheduleList] = await Promise.all([
      task.list(token),
      timeEntry.list(token, todayDate()),
      scheduledTask.list(token, todayDate()) // <--- Lấy lịch hẹn của ngày hôm nay
    ])
    setTasks(taskList)
    setTodayEntries(entries)
    setSchedules(scheduleList) // <--- Lưu vào state vừa tạo

    const active = entries.find(e => !e.end_time)
    if (active) {
      const entryDate = active.start_time.slice(0, 10)
      if (entryDate === todayDate()) {
        const [h, m, s] = active.start_time.slice(11, 19).split(':').map(Number)
        const startMs = new Date().setHours(h, m, s, 0)
        const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000))
        const totalToday = calculateTotalSecondsForTask(active.task_id, entries.filter(e => e.id !== active.id));
        
        timer.start(totalToday + elapsed)
        setActiveEntryId(active.id)
        setSelectedTaskId(active.task_id || '')
        const activeTask = taskList.find(t => t.id === active.task_id)
        if (activeTask) setSearchTerm(activeTask.title)
      }
    }
  }

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
    
    setQuickTitle('')
    setQuickColor(COLORS[0])
    setQuickCategory(CATEGORIES[0])
    setQuickEstimate(ESTIMATES[1])
    setShowQuickForm(false)
    setActivePopup(null)
  }

  const calculateTotalSecondsForTask = (taskId, entries) => {
    return entries
      .filter(e => e.task_id === taskId && e.end_time) 
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
      const totalToday = calculateTotalSecondsForTask(selectedTaskId, todayEntries);
      setActiveEntryId(entry.id)
      timer.start(totalToday) 
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
      const totalToday = calculateTotalSecondsForTask(entry.task_id, todayEntries);
      setActiveEntryId(entry.id)
      setSelectedTaskId(entry.task_id)
      setSearchTerm(getTaskTitle(entry.task_id))
      timer.start(totalToday) 
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

  // VỊ TRÍ 4: Sửa toàn bộ Logic toán học để đọc chuẩn theo bảng dữ liệu `scheduled_tasks`
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Lọc lấy các lịch trình chưa hoàn thành (is_completed = false) từ bảng scheduled_tasks
  const activeSchedules = schedules.filter(s => !s.is_completed);

  // 1. Nửa trên: Chưa đến hạn (start_time >= thời gian hiện tại)
  // Sắp xếp: Xa nhất -> Gần nhất (Giảm dần theo thời gian)
  const upcomingTasks = activeSchedules
    .filter(s => timeToMinutes(s.start_time) >= currentMinutes)
    .sort((a, b) => timeToMinutes(b.start_time) - timeToMinutes(a.start_time));

  // 2. Nửa dưới: Đã quá hạn (start_time < thời gian hiện tại)
  // Sắp xếp: Vừa mới hết hạn -> Hết hạn lâu rồi (Giảm dần theo thời gian)
  const overdueTasks = activeSchedules
    .filter(s => timeToMinutes(s.start_time) < currentMinutes)
    .sort((a, b) => timeToMinutes(b.start_time) - timeToMinutes(a.start_time));


  return (
    /* Giao diện Layout 2 Cột */
    <div style={{ display: 'flex', width: '100%', gap: '30px', alignItems: 'flex-start', padding: '10px' }}>
      
      {/* CỘT TRÁI: TIMER VÀ LOG TODAY */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className={styles.page} style={{ padding: 0, display: 'block' }}>
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
                
                <div className={styles.tagRow}>
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
                {Object.values(todayEntries.filter(e => e.end_time).reduce((acc, entry) => {
                  if (!acc[entry.task_id]) {
                    acc[entry.task_id] = { ...entry, totalDuration: 0 };
                  }
                  acc[entry.task_id].totalDuration += (entry.duration || 0);
                  if (new Date(entry.start_time) > new Date(acc[entry.task_id].start_time)) {
                    acc[entry.task_id] = { ...entry, totalDuration: acc[entry.task_id].totalDuration };
                  }
                  return acc;
                }, {})).reverse()
                .map(entry => (
                  <li key={entry.id} className={styles.logItem}>
                    <span className={styles.dot} style={{ background: getTaskColor(entry.task_id) }} />
                    <span className={styles.logTask}>{entry.task_title || getTaskTitle(entry.task_id)}</span>
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
      </div>

      {/* ======================================================== */}
      {/* CỘT PHẢI: Đã chỉnh sửa để map đúng cấu trúc object schedule */}
      {/* ======================================================== */}
      <div style={{
        width: '380px',
        height: '580px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #eaeaea',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'sticky',
        top: '10px'
      }}>
        
        {/* NỬA TRÊN: CHƯA ĐẾN HẠN (XA ĐẾN GẦN) */}
        <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', width: '100%' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#2b2b2b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4361EE' }}></span>
              Lịch trình sắp tới
            </h4>
            <span style={{ fontSize: '11px', color: '#999', marginLeft: 'auto' }}>Xa nhất → Gần nhất</span>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f4f7ff', borderRadius: '10px', border: '1px solid #e1e8ff' }}>
                  {/* Dùng getTaskTitle() để truy vết tên từ task_id */}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>{getTaskTitle(s.task_id)}</span>
                  {/* Format lại chuỗi TIME (HH:mm) để bỏ phần giây :00 */}
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', background: '#4361EE', color: '#fff', borderRadius: '6px' }}>
                    {s.start_time ? s.start_time.slice(0, 5) : ''}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', margin: 'auto' }}>Không có lịch trình sắp tới</p>
            )}
          </div>
        </div>

        {/* ĐƯỜNG PHÂN CHIA GIỮA ĐÔI CARD */}
        <div style={{ borderTop: '1px dashed #e0e0e0', margin: '0 16px' }}></div>

        {/* NỬA DƯỚI: ĐÃ QUÁ HẠN TRONG NGÀY (VỪA QUÁ HẠN ĐẾN LÂU) */}
        <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'rgba(239, 71, 111, 0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', width: '100%' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#EF476F', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF476F' }}></span>
              Đã quá hạn hôm nay
            </h4>
            <span style={{ fontSize: '11px', color: '#EF476F', opacity: 0.8, marginLeft: 'auto' }}>Mới hết → Hết lâu</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {overdueTasks.length > 0 ? (
              overdueTasks.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fff5f6', borderRadius: '10px', border: '1px solid #ffe2e6' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#555', textDecoration: 'line-through', decorationColor: '#ccc' }}>
                    {getTaskTitle(s.task_id)}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', background: '#EF476F', color: '#fff', borderRadius: '6px' }}>
                    {s.start_time ? s.start_time.slice(0, 5) : ''}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', margin: 'auto' }}>Tuyệt vời! Không có task quá hạn</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}