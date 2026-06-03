const demoToggle = document.getElementById("hero-demo-toggle");
const demoFlow = document.getElementById("hero-demo-flow");

if (demoToggle && demoFlow) {
  const panes = Array.from(demoFlow.querySelectorAll("[data-demo-pane]"));

  demoToggle.addEventListener("click", () => {
    const showingResult = demoToggle.getAttribute("aria-pressed") === "true";
    const nextPane = showingResult ? "before" : "after";

    panes.forEach((pane) => {
      pane.classList.toggle("is-active", pane.dataset.demoPane === nextPane);
    });

    demoToggle.setAttribute("aria-pressed", String(!showingResult));
    demoToggle.textContent = showingResult ? "整理結果を見る" : "メモに戻す";
  });
}
