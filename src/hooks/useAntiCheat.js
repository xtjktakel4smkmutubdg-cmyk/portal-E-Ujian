import { useEffect, useCallback, useRef, useState } from 'react';

export function useAntiCheat(sessionId, token, isActive = false) {
  const [violationCount, setViolationCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const violationCountRef = useRef(0);

  const stopAntiCheat = useCallback(() => {
    setAutoSubmitted(true); // just a flag to stop further things if we want, or better:
  }, []);

  // Let's actually just use an internal state or ref to ignore violations
  const isPausedRef = useRef(false);
  const pauseAntiCheat = useCallback(() => {
    isPausedRef.current = true;
  }, []);
  const resumeAntiCheat = useCallback(() => {
    // Add a small grace period after resuming to allow browser state to settle
    setTimeout(() => {
      isPausedRef.current = false;
    }, 1000);
  }, []);

  const recordViolation = useCallback(async (type, description) => {
    if (!sessionId || !token || !isActive || isPausedRef.current) return;

    // If it's a fullscreen exit, give a tiny grace period to re-enter
    if (type === 'fullscreen_exit') {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (document.fullscreenElement || document.webkitFullscreenElement) return;
    }

    try {
      const res = await fetch(`/api/sessions/${sessionId}/violation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ violation_type: type, description })
      });

      if (res.ok) {
        const data = await res.json();
        violationCountRef.current = data.violation_count;
        setViolationCount(data.violation_count);

        if (data.auto_submitted) {
          setAutoSubmitted(true);
          setWarningMessage('⛔ UJIAN DIBATALKAN! Terlalu banyak pelanggaran. Ujian Anda telah otomatis disubmit.');
          setShowWarning(true);
          return;
        }

        // Show warning based on count
        if (data.violation_count >= 4) {
          setWarningMessage(`🚨 PERINGATAN TERAKHIR! Pelanggaran ke-${data.violation_count}. Satu pelanggaran lagi dan ujian akan OTOMATIS DISUBMIT!`);
        } else if (data.violation_count >= 3) {
          setWarningMessage(`⚠️ PERINGATAN SERIUS! Pelanggaran ke-${data.violation_count} terdeteksi. Admin akan melihat semua pelanggaran Anda.`);
        } else {
          setWarningMessage(`⚠️ Pelanggaran terdeteksi: ${description}. Pelanggaran ke-${data.violation_count}.`);
        }
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      }
    } catch (err) {
      console.error('Failed to record violation:', err);
    }
  }, [sessionId, token, isActive]);

  useEffect(() => {
    if (!isActive) return;

    // 1. Disable right-click
    const handleContextMenu = (e) => {
      e.preventDefault();
      recordViolation('right_click', 'Klik kanan terdeteksi');
    };

    // 2. Disable copy/paste/cut
    const handleClipboard = (e) => {
      e.preventDefault();
      recordViolation('copy_attempt', `Percobaan ${e.type} terdeteksi`);
    };

    // 3. Disable keyboard shortcuts
    const handleKeyDown = (e) => {
      // Block: Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+P, Ctrl+S, Ctrl+U, Ctrl+Shift+I, F12, PrintScreen
      const blocked = [
        (e.ctrlKey || e.metaKey) && ['c', 'v', 'a', 'p', 's', 'u'].includes(e.key.toLowerCase()),
        (e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()),
        e.key === 'F12',
        e.key === 'PrintScreen',
        e.key === 'F5' && e.ctrlKey,
        e.key === 'F11',
      ].some(Boolean);

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation('keyboard_shortcut', `Shortcut terblokir: ${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`);
      }
    };

    // 4. Tab/window visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('tab_switch', 'Berpindah tab/window terdeteksi');
      }
    };

    // 5. Window blur (focus loss)
    const handleBlur = () => {
      recordViolation('window_blur', 'Fokus window hilang - kemungkinan berpindah aplikasi');
    };

    // 6. Fullscreen change detection
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        recordViolation('fullscreen_exit', 'Keluar dari mode fullscreen');
        // Try to re-enter fullscreen
        requestFullscreen();
      }
    };

    // 7. DevTools detection via resize
    const devtoolsThreshold = 160;
    const handleResize = () => {
      if (window.outerWidth - window.innerWidth > devtoolsThreshold ||
          window.outerHeight - window.innerHeight > devtoolsThreshold) {
        recordViolation('devtools', 'Kemungkinan DevTools terbuka terdeteksi');
      }
    };

    // 8. Prevent drag
    const handleDrag = (e) => {
      e.preventDefault();
    };

    // 9. Prevent select
    const handleSelectStart = (e) => {
      e.preventDefault();
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleClipboard);
    document.addEventListener('cut', handleClipboard);
    document.addEventListener('paste', handleClipboard);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('dragstart', handleDrag);
    document.addEventListener('selectstart', handleSelectStart);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', handleResize);

    // Add exam-mode class to body
    document.body.classList.add('exam-mode');

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleClipboard);
      document.removeEventListener('cut', handleClipboard);
      document.removeEventListener('paste', handleClipboard);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('dragstart', handleDrag);
      document.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('exam-mode');
    };
  }, [isActive, recordViolation]);

  return { violationCount, showWarning, warningMessage, autoSubmitted, dismissWarning: () => setShowWarning(false), pauseAntiCheat, resumeAntiCheat };
}

export function requestFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  else if (el.msRequestFullscreen) el.msRequestFullscreen();
}

export function exitFullscreen() {
  if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
}
