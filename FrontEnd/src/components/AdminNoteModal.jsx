import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

export default function AdminNoteModal({ isOpen, initialValue = '', title = 'Ghi chú xử lý (tuỳ chọn):', onClose, onSubmit }) {
  const [note, setNote] = useState(initialValue || '');

  useEffect(() => {
    setNote(initialValue || '');
  }, [initialValue, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #eee' }}>
          <strong>{title}</strong>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}><FontAwesomeIcon icon={faXmark} /></button>
        </div>

        <div style={{ padding: 16 }}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontFamily: 'inherit' }}
            placeholder="Ghi chú xử lý (tuỳ chọn)..."
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button className="admin-btn admin-btn--sm" onClick={onClose}>Cancel</button>
            <button className="admin-btn admin-btn--sm admin-btn--success" onClick={() => onSubmit(note)}>OK</button>
          </div>
        </div>
      </div>
    </div>
  );
}
