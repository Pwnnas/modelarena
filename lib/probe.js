// Injected into every graded page before any of its own scripts run
// (context.addInitScript). It records things the DOM can't show — which canvas
// contexts were created and every audio source start() — so checks can verify
// "uses WebGL" or "notes are scheduled sample-accurately" without trusting the
// page's own claims.
(() => {
  if (window.__probe) return;
  const probe = (window.__probe = {
    canvases: [],
    audio: { contexts: [], starts: [], analyserReads: 0 },
  });

  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const ctx = getContext.call(this, type, ...rest);
    if (ctx && !probe.canvases.some((c) => c.ctx === ctx)) {
      probe.canvases.push({ type: String(type), canvas: this, ctx });
    }
    return ctx;
  };

  const NativeAudioContext = window.AudioContext;
  if (!NativeAudioContext) return;

  class AudioContext extends NativeAudioContext {
    constructor(...args) {
      super(...args);
      probe.audio.contexts.push(this);
    }
  }
  window.AudioContext = AudioContext;
  window.webkitAudioContext = AudioContext;

  // AudioBufferSourceNode declares its own start(when, offset, duration), which
  // shadows the base class method, so every prototype that owns a start() is
  // wrapped individually.
  const wrapStart = (proto) => {
    if (!proto || !Object.prototype.hasOwnProperty.call(proto, 'start')) return;
    const start = proto.start;
    proto.start = function (when = 0, ...rest) {
      const ctx = this.context;
      if (!(ctx instanceof OfflineAudioContext)) {
        probe.audio.starts.push({
          node: this.constructor.name,
          when: Number(when) || 0,
          now: ctx.currentTime,
          ctx: probe.audio.contexts.indexOf(ctx),
        });
      }
      return start.call(this, when, ...rest);
    };
  };
  [
    window.AudioScheduledSourceNode,
    window.OscillatorNode,
    window.AudioBufferSourceNode,
    window.ConstantSourceNode,
  ].forEach((C) => wrapStart(C && C.prototype));

  for (const m of ['getByteFrequencyData', 'getFloatFrequencyData', 'getByteTimeDomainData', 'getFloatTimeDomainData']) {
    const orig = AnalyserNode.prototype[m];
    AnalyserNode.prototype[m] = function (...args) {
      probe.audio.analyserReads++;
      return orig.apply(this, args);
    };
  }
})();
