import React from 'react';
import '../styles/Modal.css';

export default function Modal({src, alt, onClose}) {
    return (
        <div className="modal-layer" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <img src={src} alt={alt} />
                <button className="modal-close-btn" onClick={onClose}>
                    &#10060;
                </button>
        </div>
        </div>
    )
}