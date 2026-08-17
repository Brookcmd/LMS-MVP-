import React from 'react';
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';
import { eventsList } from '../../data/universityData';

export function UpcomingEvents({ t, openModal }) {
  return (
    <section className="aau-events-section bg-secondary" id="events">
      <div className="container-wrapper">
        <div className="aau-section-header-row">
          <div className="aau-section-header">
            <span className="aau-eyebrow-small">Sheba in Motion</span>
            <h2 className="aau-title-heading">{t.eventsTitle || 'Upcoming Events & Symposiums'}</h2>
            <div className="aau-dual-line">
              <span className="line-red" />
              <span className="line-blue" />
            </div>
          </div>

          <a href="#events" className="aau-link-arrow" onClick={() => openModal('applyModal')}>
            View all <ArrowRight size={15} />
          </a>
        </div>

        <div className="events-grid">
          {eventsList.map((event) => (
            <div key={event.id} className="event-card-item">
              {/* NAVY DATE BOX WITH DAY NUMBER LARGE, MONTH SMALL */}
              <div className="event-date-badge">
                <span className="event-day">{event.day}</span>
                <span className="event-month">{event.month}</span>
              </div>

              <div className="event-content-body">
                {/* RED ONGOING / CATEGORY TAG */}
                <div className="event-category-badge">{event.category}</div>
                <h3 className="event-title">{event.title}</h3>
                <p className="event-desc">{event.description}</p>

                <div className="event-meta-row">
                  <span>
                    <Clock size={13} style={{ display: 'inline', marginRight: '4px', color: 'var(--navy-primary)' }} />
                    {event.time}
                  </span>
                  <span>
                    <MapPin size={13} style={{ display: 'inline', marginRight: '4px', color: 'var(--red-accent)' }} />
                    {event.venue}
                  </span>
                </div>
              </div>

              <button
                onClick={() => openModal('applyModal')}
                className="event-action-btn"
                title="Register / Attend"
              >
                RSVP <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
