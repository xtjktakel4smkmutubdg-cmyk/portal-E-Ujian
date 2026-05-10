import { useState, useEffect } from 'react';

export default function TypingAnimation({ text, speed = 10, className = "" }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");

    if (!text) return;

    // Create a plain text version for typing effect but we need to handle HTML if text contains it.
    // For simplicity, if it contains HTML, we'll try to just render it directly as typing HTML character by character is tricky and looks broken.
    // Let's implement a robust typewriter effect that can handle HTML tags correctly by parsing it first,
    // or just animate a wrapper opacity if it contains complex HTML.

    const containsHtml = /<[a-z][\s\S]*>/i.test(text);

    if (containsHtml) {
        // Simple fade-in for HTML content instead of character-by-character typing which breaks tags
        const el = document.createElement('div');
        el.innerHTML = text;
        const textContent = el.textContent || el.innerText || "";

        let i = 0;
        const timer = setInterval(() => {
            i += 5; // Fast forward for text content length
            if (i >= textContent.length) {
                clearInterval(timer);
                setDisplayedText(text); // Show full HTML
            } else {
                // Show partial length based on text content ratio...
                // Too complex to do right for all HTML. Just show full HTML with a CSS fade in instead.
            }
        }, speed);

        // Let's just use CSS animation for HTML
        setDisplayedText(text);
        return;
    }

    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i === text.length) clearInterval(timer);
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  // If text contains HTML, we use dangerouslySetInnerHTML
  if (text && /<[a-z][\s\S]*>/i.test(text)) {
      return (
          <div
             className={`animate-fade-in ${className}`}
             dangerouslySetInnerHTML={{ __html: displayedText }}
          />
      );
  }

  return <span className={className}>{displayedText}</span>;
}
