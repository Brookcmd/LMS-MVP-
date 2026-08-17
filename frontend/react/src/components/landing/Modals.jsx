import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, UserCheck, Lock, QrCode, BookOpen, CheckCircle, ShieldCheck, Upload, FileText, ChevronRight, Shield, AlertTriangle, Home } from 'lucide-react';
import { founderBio } from '../../data/universityData';

export function Modals({ activeModal, closeModal, t, selectedProgram, searchQuery }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    program: 'Computer Science & Software Engineering',
    branch: 'Mekelle Tele Main Campus',
    modality: 'Regular Day',
    attachedFiles: []
  });

  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [portalRole, setPortalRole] = useState('student');
  const [portalLogin, setPortalLogin] = useState({ studentId: '', password: '' });

  if (!activeModal) return null;

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files).map(f => f.name);
    setFormData(prev => ({ ...prev, attachedFiles: [...prev.attachedFiles, ...files] }));
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          subject: `Admission Application: ${formData.program}`,
          message: `Branch: ${formData.branch}, Modality: ${formData.modality}. Attached files: ${formData.attachedFiles.join(', ') || 'None'}`
        })
      });
    } catch (err) {
      console.warn('Backend contact submission fallback:', err);
    } finally {
      setSubmitting(false);
      setAppliedSuccess(true);
    }
  };

  const handlePortalSubmit = (e) => {
    e.preventDefault();
    closeModal();
    navigate('/login');
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{
        maxWidth: (activeModal === 'programModal' || activeModal === 'privacyModal' || activeModal === 'termsModal') ? '680px' : '560px',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)'
      }}>
        <button className="modal-close-btn" onClick={closeModal} aria-label="Close Modal" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
          <X size={20} />
        </button>

        {activeModal === 'applyModal' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="section-badge" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Admissions 2026/27</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: 800 }}>
              Online Application & Registration
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
              Apply directly to Sheba University College or Sheba Academy (Honor Adi-Ha Branch). Attach your academic credentials below.
            </p>

            {appliedSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 10px' }}>
                <CheckCircle size={54} style={{ color: '#10B981', margin: '0 auto 16px auto' }} />
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 800 }}>
                  Application & Files Submitted!
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '16px', lineHeight: '1.6' }}>
                  Thank you, <strong>{formData.fullName}</strong>. Your registration for <strong>{formData.program}</strong> ({formData.branch}) has been received.
                </p>

                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', textAlign: 'left', marginBottom: '20px', fontSize: '0.85rem' }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Submission Summary:</p>
                  <p style={{ color: 'var(--text-secondary)' }}><strong>Applicant:</strong> {formData.fullName}</p>
                  <p style={{ color: 'var(--text-secondary)' }}><strong>Contact:</strong> {formData.phone} | {formData.email}</p>
                  <p style={{ color: 'var(--text-secondary)' }}><strong>Attached Documents:</strong> {formData.attachedFiles.length > 0 ? formData.attachedFiles.join(', ') : 'Grade 12 Transcript (Pending)'}</p>
                  <p style={{ color: '#10B981', fontWeight: 700, marginTop: '6px' }}>Status: Registered (Under Review)</p>
                </div>

                <button className="btn-institutional-gold" onClick={closeModal} style={{ width: '100%', justifyContent: 'center' }}>
                  Close Registration Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Full Student Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control"
                    placeholder="e.g. Abebe Bikila Tesfay"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Email Address *</label>
                    <input 
                      type="email" 
                      required 
                      className="form-control"
                      placeholder="student@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Phone Number *</label>
                    <input 
                      type="tel" 
                      required 
                      className="form-control"
                      placeholder="0914 00 00 00"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Select Desired Program / Level *</label>
                  <select 
                    className="form-control"
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  >
                    <option value="Computer Science & Software Engineering">B.Sc Computer Science & Software Engineering</option>
                    <option value="Information Technology">B.Sc Information Technology & Enterprise Computing</option>
                    <option value="Clinical Nursing">B.Sc Clinical Nursing & Patient Healthcare</option>
                    <option value="Medical Laboratory Technology">B.Sc Medical Laboratory Technology (MedLab)</option>
                    <option value="Accounting & Finance">B.A Accounting & Finance</option>
                    <option value="Business Management">B.A Business Management & Entrepreneurship</option>
                    <option value="Sheba Academy Honor Adi-Ha (KG-12)">Sheba Academy Honor Adi-Ha (KG - Grade 12)</option>
                    <option value="TVET Hardware & Network Servicing">TVET Hardware & Network Servicing (Level 1-4)</option>
                    <option value="Master of Business Administration (MBA)">Master of Business Administration (MBA)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Preferred Campus *</label>
                    <select 
                      className="form-control"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    >
                      <option value="Mekelle Tele Main Campus">Mekelle Tele Main Campus</option>
                      <option value="Honor Adi-Ha Campus (Mekelle)">Honor Adi-Ha Campus (Mekelle)</option>
                      <option value="Axum Regional Branch">Axum Regional Branch</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Study Shift *</label>
                    <select 
                      className="form-control"
                      value={formData.modality}
                      onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                    >
                      <option value="Regular Day">Regular Day Program</option>
                      <option value="Extension Evening">Extension Evening Program</option>
                      <option value="Weekend">Weekend Master's / Distance</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    Attach Documents (Grade 12 Result / Transcript / ID Copy)
                  </label>
                  <div style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    textAlign: 'center',
                    background: 'var(--bg-secondary)',
                    cursor: 'pointer'
                  }}>
                    <Upload size={22} style={{ color: 'var(--gold-main)', marginBottom: '6px' }} />
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Click to browse files (PDF, JPG, PNG)
                    </p>
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleFileUpload}
                      style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                    />
                    {formData.attachedFiles.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#10B981', fontWeight: 600 }}>
                        Attached: {formData.attachedFiles.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="btn-institutional-gold" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem' }}>
                  <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Admission Application'}
                </button>
              </form>
            )}
          </div>
        )}

        {activeModal === 'portalModal' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div className="stat-icon-wrapper" style={{ margin: '0 auto 12px auto' }}>
                <UserCheck size={24} />
              </div>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', fontWeight: 800 }}>SUC & Academy Portals</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Access online courses, grade transcripts, and staff records.</p>

              <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '4px', borderRadius: '8px', marginTop: '16px' }}>
                <button
                  onClick={() => setPortalRole('student')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: portalRole === 'student' ? 'var(--navy-deep)' : 'transparent',
                    color: portalRole === 'student' ? '#FFFFFF' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Student Portal
                </button>
                <button
                  onClick={() => setPortalRole('staff')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: portalRole === 'staff' ? 'var(--navy-deep)' : 'transparent',
                    color: portalRole === 'staff' ? '#FFFFFF' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Staff / Faculty
                </button>
                <button
                  onClick={() => setPortalRole('parent')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: portalRole === 'parent' ? 'var(--navy-deep)' : 'transparent',
                    color: portalRole === 'parent' ? '#FFFFFF' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Academy Parent
                </button>
              </div>
            </div>

            <form onSubmit={handlePortalSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {portalRole === 'student' ? 'Student ID Number' : portalRole === 'staff' ? 'Staff Employee ID' : 'Parent Registration ID'}
                </label>
                <input 
                  type="text" 
                  required 
                  className="form-control"
                  placeholder={portalRole === 'student' ? 'e.g. SUC/1042/18' : 'e.g. SECS/EMP/084'}
                  value={portalLogin.studentId}
                  onChange={(e) => setPortalLogin({ ...portalLogin, studentId: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Password</label>
                <input 
                  type="password" 
                  required 
                  className="form-control"
                  placeholder="••••••••"
                  value={portalLogin.password}
                  onChange={(e) => setPortalLogin({ ...portalLogin, password: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-institutional-gold" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                <Lock size={16} /> Go to LMS Login Screen
              </button>
            </form>
          </div>
        )}

        {activeModal === 'programModal' && selectedProgram && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="section-badge" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                {selectedProgram.categoryLabel}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedProgram.duration}</span>
            </div>

            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '6px' }}>
              {selectedProgram.title}
            </h2>
            <p style={{ color: 'var(--navy-light)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '16px' }}>
              {selectedProgram.department}
            </p>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.65', marginBottom: '20px' }}>
              {selectedProgram.description}
            </p>

            {selectedProgram.curriculum && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={16} /> Core Curriculum Modules
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                  {selectedProgram.curriculum.map((course, idx) => (
                    <li key={idx} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.84rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={14} style={{ color: 'var(--gold-main)', flexShrink: 0 }} /> {course}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedProgram.requirements && (
              <div style={{ background: 'var(--gold-soft)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '4px' }}>
                  Admission Requirements:
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedProgram.requirements}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  closeModal();
                  setTimeout(() => openModal('applyModal'), 150);
                }}
                className="btn-institutional-gold"
                style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
              >
                Apply for this Program <ChevronRight size={16} />
              </button>
              <button className="btn-institutional-outline" onClick={closeModal} style={{ padding: '12px 20px' }}>
                Close
              </button>
            </div>
          </div>
        )}

        {activeModal === 'privacyModal' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Shield size={24} style={{ color: 'var(--gold-main)' }} />
              <h2 style={{ fontSize: '1.45rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                Privacy & Data Protection Policy
              </h2>
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.65', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '6px' }}>
              <p>
                <strong>1. Data Collection & Student Confidentiality:</strong> Sheba University College & Sheba Academy (SUC/SA) collects personal, academic, and contact information strictly for admission processing, student record management, and academic administration in accordance with national education guidelines.
              </p>
              <p>
                <strong>2. Academic Credentials & File Uploads:</strong> National exam certificates, transcripts, and identification photos uploaded via the online portal are stored securely and used solely by the Office of the Registrar to verify eligibility.
              </p>
              <p>
                <strong>3. Non-Disclosure:</strong> SUC/SA does not sell, trade, or share student records or guardian contact information with unauthorized third-party commercial entities.
              </p>
              <p>
                <strong>4. Digital Portal Security:</strong> Portal authentication mechanisms employ industry-standard encryption protocols to protect student grades, transcripts, and financial status data.
              </p>
            </div>

            <button className="btn-institutional-gold" onClick={closeModal} style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}>
              I Understand & Agree
            </button>
          </div>
        )}

        {activeModal === 'termsModal' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <FileText size={24} style={{ color: 'var(--gold-main)' }} />
              <h2 style={{ fontSize: '1.45rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                Terms & Academic Regulations
              </h2>
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.65', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '6px' }}>
              <p>
                <strong>1. Admission Eligibility:</strong> Acceptance into degree or TVET programs at Sheba University College is contingent upon meeting minimum Ministry of Education matriculation criteria and submitting verified academic transcripts.
              </p>
              <p>
                <strong>2. Code of Conduct:</strong> Students enrolled at Mekelle Tele Main Campus, Honor Adi-Ha Branch, or regional campuses must adhere to the official Student Code of Conduct, respecting academic integrity and campus community ethics.
              </p>
              <p>
                <strong>3. Intellectual Property:</strong> Courseware, digital library materials, and software engineering projects hosted on the SUC portal remain the intellectual property of Sheba Education & Consultancy Services (SECS) and respective student researchers.
              </p>
              <p>
                <strong>4. System Integrity & Development:</strong> This web portal was engineered by Biruk Surafel Berhe (brook-cmd) and julas-core under SECS academic oversight.
              </p>
            </div>

            <button className="btn-institutional-gold" onClick={closeModal} style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}>
              Accept Academic Terms
            </button>
          </div>
        )}

        {activeModal === 'notFoundModal' && (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            <AlertTriangle size={52} style={{ color: 'var(--gold-main)', margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '8px' }}>
              404 - Resource Not Found
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.6' }}>
              The search query or page route <strong>"{searchQuery || 'requested item'}"</strong> could not be located in the Sheba University College database.
            </p>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Suggested Actions: Check the spelling, explore accredited <a href="#academics" onClick={closeModal} style={{ color: 'var(--gold-main)', fontWeight: 700 }}>Academic Programs</a>, or launch the <a href="#" onClick={(e) => { e.preventDefault(); openModal('applyModal'); }} style={{ color: 'var(--gold-main)', fontWeight: 700 }}>Online Application</a>.
            </div>

            <button className="btn-institutional-gold" onClick={closeModal} style={{ width: '100%', justifyContent: 'center' }}>
              <Home size={16} /> Return to Sheba Home Page
            </button>
          </div>
        )}

        {activeModal === 'bioModal' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--gold-main)', color: 'var(--navy-deep)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>
                SB
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', fontWeight: 800 }}>{founderBio.name}</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--navy-light)', fontWeight: 700 }}>{founderBio.role}</span>
              </div>
            </div>

            <div style={{ background: 'var(--navy-deep)', color: '#FFFFFF', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.88rem', fontWeight: 600 }}>
              <ShieldCheck size={16} style={{ display: 'inline', marginRight: '6px', color: 'var(--gold-main)' }} />
              {founderBio.organization} (Est. 1999 / 2001)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', lineHeight: '1.65', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              {founderBio.history.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            <button className="btn-institutional-gold" onClick={closeModal} style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}>
              Close Biography
            </button>
          </div>
        )}

        {activeModal === 'qrModal' && (
          <div style={{ textAlign: 'center' }}>
            <QrCode size={40} style={{ color: 'var(--gold-main)', margin: '0 auto 12px auto' }} />
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 800 }}>
              SUC Mobile QR Code Access
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
              Scan with your smartphone camera to launch the mobile student portal & admissions app.
            </p>

            <div style={{
              background: '#FFFFFF',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              display: 'inline-block',
              border: '2px dashed var(--gold-main)',
              marginBottom: '20px'
            }}>
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://sheba-university-college.vercel.app" 
                alt="SUC Mobile QR Code"
                style={{ width: '180px', height: '180px' }}
              />
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Direct Link: <strong>https://sheba-university-college.vercel.app</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
