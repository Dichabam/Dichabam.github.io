export function initProfileCard() {
  const wrapper = document.getElementById("profile-card");
  if (!wrapper) return;
  const card = wrapper.querySelector(".pc-card");
  if (!card) return;

  let mouseX = 0;
  let mouseY = 0;
  let currentRotateX = 0;
  let currentRotateY = 0;
  let isHovering = false;
  let animationId = null;

  wrapper.addEventListener("mouseenter", () => {
    isHovering = true;
    loop();
  });

  wrapper.addEventListener("mousemove", (e) => {
    const rect = wrapper.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    const percentX = (mouseX / rect.width) * 100;
    const percentY = (mouseY / rect.height) * 100;
    wrapper.style.setProperty("--pointer-x", `${percentX}%`);
    wrapper.style.setProperty("--pointer-y", `${percentY}%`);
  });

  wrapper.addEventListener("mouseleave", () => {
    isHovering = false;
    cancelAnimationFrame(animationId);
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
  });

  function loop() {
    if (!isHovering) return;

    const rect = wrapper.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const targetRotateX = ((mouseY - centerY) / centerY) * -12;
    const targetRotateY = ((mouseX - centerX) / centerX) * 12;

    currentRotateX += (targetRotateX - currentRotateX) * 0.1;
    currentRotateY += (targetRotateY - currentRotateY) * 0.1;

    card.style.transform = `perspective(1000px) rotateX(${currentRotateX.toFixed(
      2
    )}deg) rotateY(${currentRotateY.toFixed(2)}deg)`;

    animationId = requestAnimationFrame(loop);
  }
}
