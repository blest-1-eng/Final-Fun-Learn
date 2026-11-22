export function createConfetti(x: number, y: number): void {
  if (typeof document === 'undefined') return;
  for (let i = 0; i < 18; i++) {
    const element = document.createElement('div');
    element.className = 'confetti';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.background = `hsl(${Math.random() * 360}, 85%, 60%)`;
    document.body.appendChild(element);

    const angle = Math.random() * Math.PI * 2;
    const velocity = 3 + Math.random() * 6;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;
    let opacity = 1;
    let cx = x;
    let cy = y;

    const animate = () => {
      opacity -= 0.025;
      cx += vx;
      cy += vy;
      element.style.opacity = String(opacity);
      element.style.transform = `translate(${cx - x}px, ${cy - y}px)`;
      if (opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        element.remove();
      }
    };
    requestAnimationFrame(animate);
  }
}
