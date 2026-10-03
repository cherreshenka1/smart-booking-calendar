import OpenContext from './OpenContext.jsx'
import { useEffect, useMemo, useState } from 'react'

const services = [
  { id: 'audit', title: 'UI/UX аудит', price: 4500, duration: '45 минут' },
  { id: 'frontend', title: 'Frontend консультация', price: 6200, duration: '60 минут' },
  { id: 'support', title: 'Разбор проекта', price: 7900, duration: '90 минут' },
]

const slots = ['10:00', '11:30', '13:00', '15:30', '17:00', '18:30']
const STORAGE_KEY = 'smart-booking-calendar-bookings'

const dateItems = Array.from({ length: 8 }, (_, index) => {
  const date = new Date()
  date.setDate(date.getDate() + index)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
})

function loadBookings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export default function App() {
  const [step,setStep]=useState(1)
  const [bookings, setBookings] = useState(loadBookings)
  const [serviceId, setServiceId] = useState(services[0].id)
  const [selectedDate, setSelectedDate] = useState(dateItems[0])
  const [selectedTime, setSelectedTime] = useState(slots[0])
  const [form, setForm] = useState({ name: '', phone: '' })
  const [status, setStatus] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
  }, [bookings])

  const activeService = useMemo(
    () => services.find((service) => service.id === serviceId) || services[0],
    [serviceId],
  )

  const toMinutes = time => time.split(':').reduce((h, m) => Number(h) * 60 + Number(m))
  const duration = service => parseInt(service.duration, 10)
  const isPast = time => new Date(`${selectedDate}T${time}:00`) <= new Date()
  const isSlotBooked = time => bookings.some(booking => {
    if (booking.date !== selectedDate) return false
    const previous = services.find(service => service.id === booking.serviceId) || services[0]
    const start = toMinutes(time), bookedStart = toMinutes(booking.time)
    return start < bookedStart + duration(previous) && start + duration(activeService) > bookedStart
  })
  useEffect(() => {
    if (!selectedTime || isSlotBooked(selectedTime) || isPast(selectedTime)) {
      setSelectedTime(slots.find(time => !isSlotBooked(time) && !isPast(time)) || '')
    }
  }, [serviceId, selectedDate, bookings])

  const filteredBookings = useMemo(
    () =>
      bookings
        .filter((booking) => booking.serviceId === serviceId)
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [bookings, serviceId],
  )

  const submitBooking = (event) => {
    event.preventDefault()

    if (form.name.trim().length < 2 || form.phone.replace(/\D/g,'').length < 10) {
      setStatus('Проверь имя и телефон — кажется, они заполнены не полностью.')
      return
    }

    if (!selectedTime || isPast(selectedTime) || isSlotBooked(selectedTime)) {
      setStatus('Этот слот уже занят. Выбери другое время.')
      return
    }

    const booking = {
      id: Date.now(),
      serviceId,
      serviceTitle: activeService.title,
      date: selectedDate,
      time: selectedTime,
      client: form.name.trim(),
      phone: form.phone.trim(),
    }

    setBookings((current) => [booking, ...current])
    setForm({ name: '', phone: '' })
    setStatus(`Демо-запись сохранена: ${activeService.title}, ${selectedDate}, ${selectedTime}.`)
  }

  return <div className="booking-shell"><header className="booking-nav"><a href="#workspace">встреча</a><a href="https://cherreshenka1.github.io/portfolio/">Портфолио ↗</a></header><main id="workspace" className="booking-flow"><aside className="host-profile"><div className="host-monogram">АБ</div><p>Индивидуальная консультация</p><h1>Давайте <br/>разберёмся.</h1><p>Спокойно обсудим интерфейс, код или вашу задачу. Выберите удобный формат встречи.</p><dl><dt>Формат</dt><dd>Онлайн</dd><dt>Часовой пояс</dt><dd>{Intl.DateTimeFormat().resolvedOptions().timeZone}</dd></dl><p className="demo-note">Демо-запись. Настоящая встреча не назначается.</p></aside><section className="booking-steps"><nav className="step-nav" aria-label="Этапы записи">{['Формат','Время','Детали'].map((label,i)=><button key={label} className={step===i+1?'active':''} disabled={i===2&&!selectedTime} onClick={()=>setStep(i+1)}>{i+1}. {label}</button>)}</nav>
      {step===1&&<><p className="step-label">Начнём с задачи</p><h2>Чем могу помочь?</h2><div className="services-row">{services.map(service=><button key={service.id} className={serviceId===service.id?'service-card active':'service-card'} onClick={()=>{setServiceId(service.id);setStep(2)}}><div><strong>{service.title}</strong><span>{service.duration}</span></div><p>{service.price.toLocaleString('ru-RU')} ₽ <span>↗</span></p></button>)}</div><p className="demo-note">Цены учебные. Оплата не проводится.</p></>}
      {step===2&&<><p className="step-label">{activeService.title} · {activeService.duration}</p><h2>Когда вам удобно?</h2><div className="dates-grid">{dateItems.map(date=><button key={date} onClick={()=>setSelectedDate(date)} className={date===selectedDate?'date-pill active':'date-pill'}>{new Date(date+'T12:00:00').toLocaleDateString('ru-RU',{weekday:'short',day:'numeric',month:'short'})}</button>)}</div><h3>Свободное время</h3><div className="slots-grid">{slots.map(time=><button key={time} disabled={isSlotBooked(time)||isPast(time)} className={selectedTime===time?'slot-btn active':'slot-btn'} onClick={()=>setSelectedTime(time)}>{time}<small>{isPast(time)?'Прошло':isSlotBooked(time)?'Занято':'Свободно'}</small></button>)}</div><button className="confirm-btn" disabled={!selectedTime} onClick={()=>setStep(3)}>Продолжить →</button></>}
      {step===3&&<><p className="step-label">Остался один шаг</p><h2>Всё верно?</h2><div className="appointment-summary"><strong>{activeService.title}</strong><p>{new Date(selectedDate+'T12:00:00').toLocaleDateString('ru-RU')} · {selectedTime||'Выберите другое время'} · {activeService.duration}</p><span>{activeService.price.toLocaleString('ru-RU')} ₽ · учебная цена</span></div><form className="booking-form" onSubmit={submitBooking}><label>Имя<input value={form.name} onChange={event=>setForm(prev=>({...prev,name:event.target.value}))} placeholder="Имя для демо-записи" required/></label><label>Телефон<input type="tel" value={form.phone} onChange={event=>setForm(prev=>({...prev,phone:event.target.value}))} placeholder="+7 900 000-00-00" required/></label><button className="confirm-btn" disabled={!selectedTime}>Сохранить демо-запись</button></form></>}
      {status&&<p className="status-box" role="status">{status}</p>}<details className="upcoming-card"><summary>Мои записи · {filteredBookings.length}</summary>{filteredBookings.length?filteredBookings.map(booking=><article className="booking-item" key={booking.id}><strong>{booking.client} · {booking.date} / {booking.time}</strong><p>{booking.serviceTitle}</p><button onClick={()=>{setBookings(current=>current.filter(item=>item.id!==booking.id));setStatus('Запись отменена. Время снова доступно.')}}>Отменить запись</button></article>):<p>Пока нет записей по этой услуге.</p>}</details></section></main><details className="sources"><summary>О проекте и данных</summary><OpenContext/></details></div>
}
