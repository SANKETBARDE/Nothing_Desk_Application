import React, { useState, useEffect, useRef } from 'react';
import { History, Trash2, ArrowLeft, RotateCcw } from 'lucide-react';

interface CalculatorAppProps {
  windowId: string;
}

interface HistoryItem {
  id: string;
  equation: string;
  result: string;
  timestamp: number;
}

export const CalculatorApp: React.FC<CalculatorAppProps> = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistoryCompact, setShowHistoryCompact] = useState(false);
  const [isNewNumber, setIsNewNumber] = useState(false);

  // Responsive container measurement
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 340, height: 480 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: Math.round(entry.contentRect.width),
          height: Math.round(entry.contentRect.height),
        });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const isWide = dimensions.width >= 540;

  // Handle number input
  const handleDigit = (digit: string) => {
    if (isNewNumber) {
      setDisplay(digit);
      setIsNewNumber(false);
      return;
    }
    setDisplay((prev) => {
      if (prev === '0' || prev === 'Error') return digit;
      if (prev.length >= 16) return prev;
      return prev + digit;
    });
  };

  // Handle decimal point
  const handleDecimal = () => {
    if (isNewNumber) {
      setDisplay('0.');
      setIsNewNumber(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay((prev) => prev + '.');
    }
  };

  // Handle operators
  const handleOperator = (op: string) => {
    setIsNewNumber(false);
    if (display === 'Error') return;
    setEquation(`${display} ${op} `);
    setDisplay('0');
  };

  // Clear all
  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsNewNumber(false);
  };

  // Backspace / Delete last char
  const handleBackspace = () => {
    if (display === 'Error' || isNewNumber) {
      setDisplay('0');
      setIsNewNumber(false);
      return;
    }
    setDisplay((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  // Negate ±
  const handleNegate = () => {
    if (display === '0' || display === 'Error') return;
    setDisplay((prev) => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
  };

  // Percentage %
  const handlePercent = () => {
    if (display === 'Error') return;
    const val = Number(display);
    if (isNaN(val)) return;
    setDisplay(String(Number((val / 100).toPrecision(10))));
  };

  // Square root √
  const handleSqrt = () => {
    const val = Number(display);
    if (isNaN(val) || val < 0) {
      setDisplay('Error');
      return;
    }
    const res = Math.sqrt(val);
    setDisplay(String(Number(res.toPrecision(10))));
    setIsNewNumber(true);
  };

  // Square x²
  const handleSquare = () => {
    const val = Number(display);
    if (isNaN(val)) {
      setDisplay('Error');
      return;
    }
    const res = val * val;
    setDisplay(String(Number(res.toPrecision(10))));
    setIsNewNumber(true);
  };

  // Reciprocal 1/x
  const handleReciprocal = () => {
    const val = Number(display);
    if (isNaN(val) || val === 0) {
      setDisplay('Error');
      return;
    }
    const res = 1 / val;
    setDisplay(String(Number(res.toPrecision(10))));
    setIsNewNumber(true);
  };

  // Pi π
  const handlePi = () => {
    setDisplay(String(Math.PI).slice(0, 10));
    setIsNewNumber(true);
  };

  // Calculate result
  const handleCalculate = () => {
    if (!equation && !display) return;
    try {
      const fullExp = (equation + display).replace(/×/g, '*').replace(/÷/g, '/');
      if (/^[0-9+\-*/.() ]+$/.test(fullExp)) {
        // Safe evaluation of mathematical expression
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${fullExp})`)();
        if (!isFinite(result) || isNaN(result)) {
          setDisplay('Error');
          return;
        }
        const formatted = String(Number(result.toPrecision(10)));
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          equation: `${equation + display}`,
          result: formatted,
          timestamp: Date.now(),
        };
        setHistory((prev) => [newItem, ...prev.slice(0, 29)]);
        setDisplay(formatted);
        setEquation('');
        setIsNewNumber(true);
      }
    } catch {
      setDisplay('Error');
    }
  };

  // Recall item from history
  const handleRecallHistory = (item: HistoryItem) => {
    setDisplay(item.result);
    setEquation('');
    setIsNewNumber(true);
    setShowHistoryCompact(false);
  };

  // Keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input elsewhere
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === '.') {
        handleDecimal();
      } else if (e.key === '+') {
        handleOperator('+');
      } else if (e.key === '-') {
        handleOperator('-');
      } else if (e.key === '*') {
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        handleClear();
      } else if (e.key === '%') {
        handlePercent();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [display, equation, isNewNumber]);

  // Standard 4-col buttons for compact mode
  const COMPACT_BTNS = [
    { label: 'C', type: 'func', action: handleClear },
    { label: '⌫', type: 'func', action: handleBackspace },
    { label: '%', type: 'func', action: handlePercent },
    { label: '÷', type: 'op', action: () => handleOperator('÷') },

    { label: '7', type: 'num', action: () => handleDigit('7') },
    { label: '8', type: 'num', action: () => handleDigit('8') },
    { label: '9', type: 'num', action: () => handleDigit('9') },
    { label: '×', type: 'op', action: () => handleOperator('×') },

    { label: '4', type: 'num', action: () => handleDigit('4') },
    { label: '5', type: 'num', action: () => handleDigit('5') },
    { label: '6', type: 'num', action: () => handleDigit('6') },
    { label: '-', type: 'op', action: () => handleOperator('-') },

    { label: '1', type: 'num', action: () => handleDigit('1') },
    { label: '2', type: 'num', action: () => handleDigit('2') },
    { label: '3', type: 'num', action: () => handleDigit('3') },
    { label: '+', type: 'op', action: () => handleOperator('+') },

    { label: '±', type: 'func', action: handleNegate },
    { label: '0', type: 'num', action: () => handleDigit('0') },
    { label: '.', type: 'num', action: handleDecimal },
    { label: '=', type: 'eq', action: handleCalculate },
  ];

  // Extended 5-col buttons for wide / maximized mode
  const WIDE_BTNS = [
    { label: '√', type: 'sci', action: handleSqrt },
    { label: 'C', type: 'func', action: handleClear },
    { label: '⌫', type: 'func', action: handleBackspace },
    { label: '%', type: 'func', action: handlePercent },
    { label: '÷', type: 'op', action: () => handleOperator('÷') },

    { label: 'x²', type: 'sci', action: handleSquare },
    { label: '7', type: 'num', action: () => handleDigit('7') },
    { label: '8', type: 'num', action: () => handleDigit('8') },
    { label: '9', type: 'num', action: () => handleDigit('9') },
    { label: '×', type: 'op', action: () => handleOperator('×') },

    { label: '1/x', type: 'sci', action: handleReciprocal },
    { label: '4', type: 'num', action: () => handleDigit('4') },
    { label: '5', type: 'num', action: () => handleDigit('5') },
    { label: '6', type: 'num', action: () => handleDigit('6') },
    { label: '-', type: 'op', action: () => handleOperator('-') },

    { label: 'π', type: 'sci', action: handlePi },
    { label: '1', type: 'num', action: () => handleDigit('1') },
    { label: '2', type: 'num', action: () => handleDigit('2') },
    { label: '3', type: 'num', action: () => handleDigit('3') },
    { label: '+', type: 'op', action: () => handleOperator('+') },

    { label: '±', type: 'func', action: handleNegate },
    { label: '(', type: 'sci', action: () => handleDigit('(') },
    { label: '0', type: 'num', action: () => handleDigit('0') },
    { label: '.', type: 'num', action: handleDecimal },
    { label: '=', type: 'eq', action: handleCalculate },
  ];

  // Render History List component
  const renderHistoryContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isWide && (
            <button
              onClick={() => setShowHistoryCompact(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#aaa',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#888' }}>
            CALCULATION HISTORY
          </span>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => setHistory([])}
            title="Clear history"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ff4d4f')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {history.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#555',
              fontSize: 12,
              gap: 8,
            }}
          >
            <RotateCcw size={24} style={{ opacity: 0.3 }} />
            <span>No previous calculations</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleRecallHistory(item)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  textAlign: 'right',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(215, 25, 33, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                }}
              >
                <div style={{ fontSize: 11, color: '#888', fontFamily: 'monospace', marginBottom: 2 }}>
                  {item.equation}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                  = {item.result}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        background: '#09090b',
        color: '#fff',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Main Calculator Body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '12px 14px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Compact Mode: History View */}
        {!isWide && showHistoryCompact ? (
          <div
            style={{
              flex: 1,
              background: '#111116',
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
            }}
          >
            {renderHistoryContent()}
          </div>
        ) : (
          <>
            {/* Top Toolbar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                height: 28,
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: '#666',
                    fontFamily: 'monospace',
                  }}
                >
                  {isWide ? 'NOTHING // SCIENTIFIC' : 'NOTHING // CALC'}
                </span>
              </div>

              {!isWide && (
                <button
                  onClick={() => setShowHistoryCompact(true)}
                  style={{
                    background: history.length > 0 ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#888',
                    cursor: 'pointer',
                    padding: '3px 8px',
                    borderRadius: 5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                  }}
                  title="View History"
                >
                  <History size={13} />
                  <span>{history.length > 0 ? history.length : ''}</span>
                </button>
              )}
            </div>

            {/* Display Box */}
            <div
              style={{
                background: '#121217',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 10,
                textAlign: 'right',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                flexShrink: 0,
                minHeight: isWide ? 85 : 72,
                position: 'relative',
              }}
            >
              {/* Equation line */}
              <div
                style={{
                  fontSize: 12,
                  color: '#777',
                  fontFamily: 'monospace',
                  minHeight: 16,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {equation}
              </div>

              {/* Number line with adaptive font size */}
              <div
                style={{
                  fontSize: display.length > 12 ? 22 : display.length > 8 ? 28 : 34,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: '0.04em',
                  color: '#fff',
                  lineHeight: '1.2',
                  wordBreak: 'break-all',
                }}
              >
                {display}
              </div>
            </div>

            {/* Button Grid - dynamically fills remaining height via flex: 1 */}
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: `repeat(${isWide ? 5 : 4}, 1fr)`,
                gridTemplateRows: 'repeat(5, 1fr)',
                gap: 6,
                minHeight: 0,
              }}
            >
              {(isWide ? WIDE_BTNS : COMPACT_BTNS).map((b, idx) => {
                const isEq = b.type === 'eq';
                const isOp = b.type === 'op';
                const isSci = b.type === 'sci';
                const isFunc = b.type === 'func';

                return (
                  <button
                    key={idx}
                    onClick={b.action}
                    style={{
                      height: '100%',
                      minHeight: 0,
                      borderRadius: 8,
                      border: '1px solid',
                      borderColor: isEq
                        ? '#d71921'
                        : isOp
                        ? 'rgba(215, 25, 33, 0.25)'
                        : isSci
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(255, 255, 255, 0.07)',
                      background: isEq
                        ? '#d71921'
                        : isOp
                        ? 'rgba(215, 25, 33, 0.12)'
                        : isFunc
                        ? '#1c1c22'
                        : isSci
                        ? '#141419'
                        : '#17171d',
                      color: isEq ? '#fff' : isOp ? '#ff4d4f' : isSci ? '#aaa' : '#fff',
                      fontSize: 16,
                      fontWeight: isEq || isOp ? 700 : 600,
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.08s ease',
                      boxShadow: isEq ? '0 2px 10px rgba(215, 25, 33, 0.3)' : 'none',
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.96)';
                      e.currentTarget.style.filter = 'brightness(1.25)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.filter = 'none';
                    }}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Wide Mode: Persistent History Sidebar */}
      {isWide && (
        <div
          style={{
            width: 250,
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            background: '#0d0d11',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {renderHistoryContent()}
        </div>
      )}
    </div>
  );
};
