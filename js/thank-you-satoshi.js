document.addEventListener('DOMContentLoaded', function() {
  const page21 = document.getElementById('page21');
  const canvas = document.getElementById('circleTextCanvas');
  const ctx = canvas.getContext('2d');
  
  const thanksTexts = [
    "Thank You, Satoshi",
    "ありがとう、サトシ",
    "谢谢你，中本聪",
    "Gracias, Satoshi",
    "Merci, Satoshi",
    "Danke, Satoshi",
    "Obrigado, Satoshi",
    "Grazie, Satoshi",
    "Спасибо, Сатоши",
    "감사합니다, 사토시",
    "धन्यवाद, सातोशी",
    "Teşekkürler, Satoshi",
    "شكراً، ساتوشي",
    "Dziękuję, Satoshi",
    "Tack, Satoshi",
    "תודה, סאטושי",
    "Mulțumesc, Satoshi",
    "Terima kasih, Satoshi",
    "Dank je, Satoshi",
    "Kiitos, Satoshi",
    "Ευχαριστώ, Σατόσι"
  ];
  
  let angle = 0;
  let radius = 0;
  let animationFrameId = null;
  let isInitialized = false;
  let lastFrameTime = null;
  const TARGET_FPS = 20; // Target 20 FPS
  const FRAME_INTERVAL = 1000 / TARGET_FPS; // 50ms per frame

  // Set initial canvas styles
  Object.assign(canvas.style, {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'block',
    width: '100%',
    height: '100%',
    zIndex: '5'
  });

  function resizeCanvas() {
    const container = canvas.parentElement;
    if (!container || !page21.classList.contains('active')) return;

    const width = container.offsetWidth;
    const height = container.offsetHeight;

    if (width === 0 || height === 0) return;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    radius = Math.min(width, height) * 0.41;
    isInitialized = true;
    drawCircularText();
  }

  function drawCircularText() {
    if (!isInitialized || !canvas.width || !canvas.height) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const numTextsToDisplay = 21;
    const angleBetweenTexts = (2 * Math.PI) / numTextsToDisplay;
    const fontSize = getResponsiveFontSize();

    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < numTextsToDisplay; i++) {
      const text = thanksTexts[i];
      const textAngle = (i * angleBetweenTexts) + angle;
      const x = centerX + radius * Math.cos(textAngle);
      const y = centerY + radius * Math.sin(textAngle);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(textAngle + 0.2 * Math.PI);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }

  function getResponsiveFontSize() {
    const baseDimension = Math.min(canvas.width, canvas.height);
    if (baseDimension < 576) return 16;
    if (baseDimension < 768) return 18;
    if (baseDimension < 1200) return 21;
    if (baseDimension < 2000) return 25;
    return 30;
  }

  function animate(timestamp) {
    if (!page21.classList.contains('active')) return;

    // Initialize lastFrameTime on first frame
    if (!lastFrameTime) lastFrameTime = timestamp;

    // Calculate elapsed time since last frame
    const elapsed = timestamp - lastFrameTime;

    // Only update if enough time has passed for 20 FPS
    if (elapsed >= FRAME_INTERVAL) {
      angle += 0.01; // Keep original rotation speed
      drawCircularText();
      lastFrameTime = timestamp - (elapsed % FRAME_INTERVAL); // Adjust for smoother timing
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (animationFrameId) return;
    if (!isInitialized) resizeCanvas();
    lastFrameTime = null; // Reset for new animation start
    animationFrameId = requestAnimationFrame(animate);
  }

  function stopAnimation() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function checkPageVisibility() {
    if (page21.classList.contains('active')) {
      if (!isInitialized) {
        resizeCanvas();
        drawCircularText();
      }
      startAnimation();
    } else {
      stopAnimation();
      isInitialized = false;
    }
  }

  function initialize() {
    if (!page21.classList.contains('active')) {
      setTimeout(initialize, 100);
      return;
    }

    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      setTimeout(initialize, 100);
      return;
    }

    resizeCanvas();
    drawCircularText();
    checkPageVisibility();
  }

  // Start initialization
  initialize();

  // Observer for class changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        checkPageVisibility();
      }
    });
  });
  observer.observe(page21, { attributes: true });

  // Resize handler with debounce
  let resizeTimeout;
  window.addEventListener('resize', () => {
    if (!page21.classList.contains('active')) return;
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resizeCanvas();
      drawCircularText();
    }, 100);
  });

  // Cleanup
  window.addEventListener('unload', () => {
    stopAnimation();
    observer.disconnect();
  });
});