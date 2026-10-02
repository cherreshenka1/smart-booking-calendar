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

  return (
    <div className="booking-shell">
      <header className="hero-card">
        <p className="eyebrow">Smart Booking Calendar</p>
        <h1>Давайте выберем время</h1>
        <p className="hero-text">Выберите формат встречи, удобный день и свободное время. Все детали будут видны до подтверждения.</p>
      </header>

      <main className="booking-grid">
        <section className="left-panel">
          <div className="services-row">
            {services.map((service) => (
              <button
                type="button"
                key={service.id}
                className={service.id === serviceId ? 'service-card active' : 'service-card'}
                onClick={() => setServiceId(service.id)}
              >
                <span>{service.duration}</span>
                <strong>{service.title}</strong>
                <p>{service.price.toLocaleString('ru-RU')} ₽</p>
              </button>
            ))}
          </div>

          <div className="calendar-panel">
            <h2>Выбери дату</h2>
            <div className="dates-grid">
              {dateItems.map((date) => {
                const formatted = new Date(date).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: 'short',
                })
                return (
                  <button
                    type="button"
                    key={date}
                    className={selectedDate === date ? 'date-pill active' : 'date-pill'}
                    onClick={() => setSelectedDate(date)}
                  >
                    {formatted}
                  </button>
                )
              })}
            </div>

            <h2>Свободные слоты</h2>
            <div className="slots-grid">
              {slots.map((time) => {
                const booked = isSlotBooked(time) || isPast(time)
                return (
                  <button
                    type="button"
                    key={time}
                    className={`${selectedTime === time ? 'slot-btn active' : 'slot-btn'} ${booked ? 'booked' : ''}`}
                    onClick={() => !booked && setSelectedTime(time)}
                    disabled={booked}
                  >
                    {time}
                    <small>{isPast(time) ? 'Прошло' : booked ? 'Занято' : 'Свободно'}</small>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <aside className="right-panel">
          <p className="demo-note">Демо-календарь одного специалиста. Реальная встреча не назначается. Используйте вымышленные данные.</p><form className="booking-form" onSubmit={submitBooking}>
            <p className="eyebrow">Ваша встреча</p><p className="demo-note">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString('ru-RU')} · {selectedTime || 'Нет свободного времени'} · {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
            <h2>{activeService.title}</h2>
            <label>
              Имя
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Артём"
              />
            </label>
            <label>
              Телефон
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+7 900 000-00-00"
              />
            </label>
            <button type="submit" className="confirm-btn" disabled={!selectedTime}>
              Сохранить демо-запись
            </button>
            {status && <div role="status" className="status-box">{status}</div>}
          </form>

          <div className="upcoming-card">
            <div className="upcoming-head">
              <h2>Ближайшие записи</h2>
              <span>{filteredBookings.length}</span>
            </div>
            <div className="booking-list">
              {filteredBookings.length === 0 ? (
                <p className="empty-text">Пока нет записей по этой услуге.</p>
              ) : (
                filteredBookings.map((booking) => (
                  <article className="booking-item" key={booking.id}>
                    <div>
                      <strong>{booking.client}</strong>
                      <p>{booking.date} • {booking.time}</p>
                    </div>
                    <span>{booking.serviceTitle}</span><button type="button" onClick={() => {setBookings(current => current.filter(item => item.id !== booking.id)); setStatus("Запись отменена. Время снова доступно.")}}>Отменить запись</button>
                  </article>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
