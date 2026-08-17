import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

export function FinalCTA({ t, openModal }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <section className="aau-newsletter-section bg-white">
      <div className="container-wrapper">
        <div className="aau-newsletter-box">
          <h2 className="aau-newsletter-title">
            {t.subscribeHeading || 'SUBSCRIBE TO OUR NEWSLETTER.'}
          </h2>
          <p className="aau-newsletter-desc">
            Receive official admissions announcements, academic research bulletins, and institutional news directly to your inbox.
          </p>

          {subscribed ? (
            <div className="aau-subscribe-success">
              <CheckCircle2 size={18} /> Subscribed successfully to SUC Newsletter!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="aau-newsletter-form">
              <input
                type="email"
                required
                placeholder={t.subscribePlaceholder || "Enter your email address..."}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="aau-newsletter-input"
              />
              <button type="submit" className="btn-aau-primary">
                <Send size={15} /> {t.btnSubscribe || 'Subscribe'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
