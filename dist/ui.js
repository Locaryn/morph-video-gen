(function () {
  "use strict";

  const CSS = `
:host { display: block; width: 100%; color: var(--text, #e8edf5); font-family: inherit; box-sizing: border-box; }
* { box-sizing: border-box; }
.panel-container { width: 100%; max-width: 920px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
.header-card {
  display: flex; align-items: center; justify-content: space-between; padding: 16px 20px;
  background: var(--surface, rgba(255, 255, 255, 0.035)); border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius, 12px);
}
.title-wrap { display: flex; align-items: center; gap: 12px; }
.icon-box {
  width: 40px; height: 40px; border-radius: 10px; background: rgba(var(--accent-rgb, 110, 168, 254), 0.15);
  color: var(--accent, #6ea8fe); display: grid; place-items: center; font-size: 20px;
}
.title { font-size: 16px; font-weight: 700; color: var(--text, #e8edf5); }
.subtitle { font-size: 12px; color: var(--text-faint, #96a3b8); margin-top: 2px; }
.badge {
  display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 99px; font-size: 11px;
  font-weight: 600; background: rgba(101, 211, 145, 0.12); color: #65d391; border: 1px solid rgba(101, 211, 145, 0.25);
}
.field-card {
  display: flex; flex-direction: column; gap: 10px; background: var(--surface, rgba(255, 255, 255, 0.035));
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1)); border-radius: var(--radius, 12px); padding: 16px;
}
.label { font-size: 11px; font-weight: 700; color: var(--text-dim, #94a3b8); text-transform: uppercase; letter-spacing: 0.06em; }
.textarea, .select {
  width: 100%; border: 1px solid var(--border, rgba(255, 255, 255, 0.14)); border-radius: var(--radius-sm, 8px);
  background: var(--bg, rgba(0, 0, 0, 0.25)); color: inherit; padding: 10px 12px; font: inherit; font-size: 13px; outline: none;
}
.textarea { min-height: 80px; resize: vertical; }
.btn-primary {
  width: 100%; padding: 12px; background: var(--accent, #6ea8fe); color: #0b101b; border: none;
  border-radius: var(--radius-sm, 8px); font-weight: 700; font-size: 14px; cursor: pointer;
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
`;

  class LocarynVideoGenPanel extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.prompt = "";
      this.frames = 24;
      this.isGenerating = false;
    }
    connectedCallback() { this.render(); }

    async generate() {
      if (!this.prompt.trim() || this.isGenerating) return;
      this.isGenerating = true;
      this.render();
      try {
        const bridge = window.locaryn || window.LocarynPluginAPI;
        if (bridge && bridge.invokeExtensionTool) {
          await bridge.invokeExtensionTool("generate_video", { prompt: this.prompt, num_frames: Number(this.frames) });
        }
      } catch (err) {
        alert("Erreur de génération vidéo: " + err);
      } finally {
        this.isGenerating = false;
        this.render();
      }
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <div class="panel-container">
          <div class="header-card">
            <div class="title-wrap">
              <div class="icon-box">🎬</div>
              <div>
                <div class="title">Studio Vidéo & Animation</div>
                <div class="subtitle">Génération de clips vidéo via AnimateDiff & CogVideoX</div>
              </div>
            </div>
            <div class="badge">Actif</div>
          </div>

          <div class="field-card">
            <label class="label">Scénario & Mouvement (Prompt)</label>
            <textarea class="textarea" id="vg-prompt" placeholder="Ex: Drone shot flying over a futuristic neon city at night, rain reflections, 4k...">${this.prompt}</textarea>
          </div>

          <div class="field-card">
            <label class="label">Durée & Nombre de frames</label>
            <select class="select" id="vg-frames">
              <option value="16" ${this.frames === 16 ? "selected" : ""}>16 frames (~1.5s)</option>
              <option value="24" ${this.frames === 24 ? "selected" : ""}>24 frames (~2.0s)</option>
              <option value="48" ${this.frames === 48 ? "selected" : ""}>48 frames (~4.0s)</option>
            </select>
          </div>

          <button class="btn-primary" id="vg-btn" ${this.isGenerating || !this.prompt.trim() ? "disabled" : ""}>
            ${this.isGenerating ? "Rendu vidéo en cours..." : "Générer la vidéo"}
          </button>
        </div>
      `;

      const promptEl = this.shadowRoot.querySelector("#vg-prompt");
      if (promptEl) {
        promptEl.addEventListener("input", (e) => {
          this.prompt = e.target.value;
          const btn = this.shadowRoot.querySelector("#vg-btn");
          if (btn) btn.disabled = !this.prompt.trim() || this.isGenerating;
        });
      }

      const framesEl = this.shadowRoot.querySelector("#vg-frames");
      if (framesEl) {
        framesEl.addEventListener("change", (e) => { this.frames = Number(e.target.value); });
      }

      const btn = this.shadowRoot.querySelector("#vg-btn");
      if (btn) {
        btn.addEventListener("click", () => this.generate());
      }
    }
  }

  if (!customElements.get("locaryn-video-gen-panel")) {
    customElements.define("locaryn-video-gen-panel", LocarynVideoGenPanel);
  }
})();
