import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * AppleSelect — A premium, custom dropdown component.
 * Uses createPortal to ensure menus are never clipped by parent containers.
 */
export default function AppleSelect({ value, onChange, options = [], placeholder = 'Select...', disabled = false, className = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef(null);
    const portalRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target) &&
                portalRef.current && !portalRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
        }
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen]);

    // Position management
    const updatePosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;
            setCoords({
                top: rect.bottom + scrollY + 4,
                left: rect.left + scrollX,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    const normalizedOptions = options.map(opt =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    const selectedOption = normalizedOptions.find(opt => opt.value === value);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
    };

    const menu = isOpen && !disabled ? createPortal(
        <div
            ref={portalRef}
            className="fixed z-[9999] p-1.5 bg-white/90 backdrop-blur-xl border border-gray-100/50 rounded-2xl shadow-2xl animate-apple overflow-hidden pointer-events-auto"
            style={{
                top: `${coords.top - window.scrollY}px`,
                left: `${coords.left - window.scrollX}px`,
                width: `${coords.width}px`
            }}
        >
            <div className="max-h-60 overflow-y-auto scrollbar-thin">
                {normalizedOptions.length === 0 ? (
                    <div className="px-4 py-2 text-xs text-gray-400 font-bold uppercase tracking-widest text-center">No Options</div>
                ) : (
                    normalizedOptions.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelect(opt.value)}
                            className={`
                w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-200 flex items-center justify-between group
                ${value === opt.value ? 'bg-blue-50 text-[#007AFF] font-bold' : 'text-gray-600 hover:bg-gray-50'}
              `}
                        >
                            <span className="truncate">{opt.label}</span>
                            {value === opt.value && (
                                <svg className="w-4 h-4 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className={`w-full ${className}`} ref={containerRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`
          w-full flex items-center justify-between px-6 py-3 border border-gray-100 rounded-xl
          bg-gray-50/20 text-[#1C1C1E] text-sm font-semibold transition-all duration-300
          hover:bg-white active:scale-[0.98] outline-none
          ${isOpen ? 'ring-4 ring-blue-100/30 border-[#007AFF] bg-white' : ''}
          ${disabled ? 'opacity-40 cursor-not-allowed bg-transparent' : 'cursor-pointer'}
        `}
            >
                <span className="truncate">{displayLabel}</span>
                <svg
                    className={`w-4 h-4 text-gray-300 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#007AFF]' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {menu}
        </div>
    );
}
