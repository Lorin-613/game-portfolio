/* ═══ 程序化音效系统（Web Audio 合成，无需音频文件） ═══
   梦幻治愈调性：全部为软起音的 sine 铃音 + 长混响尾巴 + 呼吸式和声垫，
   同时保留指针空气声、滚动调制、物理弹跳等动态反馈。
   浏览器要求用户手势后才能出声：首次 pointerdown 自动解锁，导航栏有静音开关。 */

const KEY = 'yk-sound'
const MASTER = 0.82

let ctx: AudioContext | null = null
let master: GainNode | null = null
let wetIn: GainNode | null = null
let airGain: GainNode | null = null
let padGain: GainNode | null = null
let enabled = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) !== 'off' : true
let started = false
let dustTimer: ReturnType<typeof setTimeout> | null = null

/* 五声音阶（C 大调宫商角徵羽），章节依次取音 */
export const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]

function noiseBuffer(c: AudioContext) {
  const len = Math.floor(c.sampleRate * 2)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return buf
}

function build() {
  if (ctx) return
  const AC: typeof AudioContext | undefined =
    (window as any).AudioContext || (window as any).webkitAudioContext
  if (!AC) return
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = MASTER
  master.connect(ctx.destination)

  /* 双抽头反馈延迟充当柔光混响：更长的尾巴让每一声都有「雾感」 */
  wetIn = ctx.createGain()
  wetIn.gain.value = 0.62
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 240
  wetIn.connect(hp)

  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1650
  lp.Q.value = 0.35
  lp.connect(master)

  ;[0.16, 0.33].forEach((d, i) => {
    const delay = ctx!.createDelay(0.6)
    delay.delayTime.value = d
    const fb = ctx!.createGain()
    fb.gain.value = i === 0 ? 0.36 : 0.26
    hp.connect(delay)
    delay.connect(lp)
    delay.connect(fb)
    fb.connect(delay)
  })

  /* 空气底噪：音量跟随指针移动速度，形成「指尖划过空气」的质感 */
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx)
  src.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 1150
  bp.Q.value = 0.55
  airGain = ctx.createGain()
  airGain.gain.value = 0
  src.connect(bp)
  bp.connect(airGain)
  airGain.connect(master)
  src.start()

  /* 极轻和声垫：让整个页面有「游戏世界在呼吸」的底噪，滤波缓慢起伏 */
  padGain = ctx.createGain()
  padGain.gain.value = 0
  const plp = ctx.createBiquadFilter()
  plp.type = 'lowpass'
  plp.frequency.value = 620
  plp.connect(padGain)
  padGain.connect(master)
  ;[130.81, 196, 261.63].forEach((f, i) => {
    const o = ctx!.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    const g = ctx!.createGain()
    g.gain.value = 0.42 / (i + 1)
    o.connect(g)
    g.connect(plp)
    o.start()
  })
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.06
  const lfoAmt = ctx.createGain()
  lfoAmt.gain.value = 210
  lfo.connect(lfoAmt)
  lfoAmt.connect(plp.frequency)
  lfo.start()

  /* 高音微光：只随缓慢振幅起伏，作为极淡的「梦尘」 */
  const shim = ctx.createOscillator()
  shim.type = 'sine'
  shim.frequency.value = 1046.5
  const shimGain = ctx.createGain()
  shimGain.gain.value = 0
  const shimLfo = ctx.createOscillator()
  shimLfo.frequency.value = 0.045
  const shimAmt = ctx.createGain()
  shimAmt.gain.value = 0.005
  shimLfo.connect(shimAmt)
  shimAmt.connect(shimGain.gain)
  shimLfo.start()
  shim.connect(shimGain)
  shimGain.connect(master)
  shim.start()
}

function ok() {
  return enabled && !!ctx && ctx.state === 'running'
}

/* 柔和铃音：慢起音（bloom）→ 长衰减，可选滑音，全部送混响 */
function tone(
  freq: number,
  dur: number,
  peak: number,
  opts: { type?: OscillatorType; glideTo?: number; delay?: number; attack?: number } = {}
) {
  if (!ok()) return
  const t = ctx!.currentTime + (opts.delay || 0)
  const atk = Math.min(dur * 0.5, opts.attack ?? 0.05)
  const o = ctx!.createOscillator()
  o.type = opts.type || 'sine'
  o.frequency.setValueAtTime(freq, t)
  if (opts.glideTo) o.frequency.exponentialRampToValueAtTime(opts.glideTo, t + dur)
  const g = ctx!.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + atk)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g)
  g.connect(master!)
  if (wetIn) g.connect(wetIn)
  o.start(t)
  o.stop(t + dur + 0.08)
}

/* 滤波噪声爆音：whoosh / thud 共用 */
function noiseBurst(dur: number, peak: number, f0: number, f1: number, q = 1.2) {
  if (!ok()) return
  const t = ctx!.currentTime
  const src = ctx!.createBufferSource()
  src.buffer = noiseBuffer(ctx!)
  const bp = ctx!.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = q
  bp.frequency.setValueAtTime(f0, t)
  bp.frequency.exponentialRampToValueAtTime(f1, t + dur)
  const g = ctx!.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.34)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(bp)
  bp.connect(g)
  g.connect(master!)
  if (wetIn) g.connect(wetIn)
  src.start(t)
  src.stop(t + dur + 0.03)
}

/* 梦尘：每隔 7~14 秒飘来一个极轻的长音，让静谧时也有呼吸 */
function scheduleDust() {
  if (dustTimer) clearTimeout(dustTimer)
  dustTimer = setTimeout(() => {
    if (ok() && document.visibilityState === 'visible') {
      const i = Math.floor(Math.random() * PENTATONIC.length)
      tone(PENTATONIC[i] * (Math.random() < 0.3 ? 2 : 1), 3.4, 0.02, { attack: 0.4 })
    }
    scheduleDust()
  }, 7000 + Math.random() * 7000)
}

function resume() {
  build()
  started = true
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume()
  /* 底噪与和声垫淡入，避免突然出声 */
  if (airGain) airGain.gain.setTargetAtTime(0, ctx.currentTime, 0.2)
  if (padGain) padGain.gain.setTargetAtTime(enabled ? 0.05 : 0, ctx.currentTime, 1.8)
  if (!dustTimer) scheduleDust()
}

function applyMute(mute: boolean) {
  enabled = !mute
  localStorage.setItem(KEY, mute ? 'off' : 'on')
  if (!ctx) return
  if (padGain) padGain.gain.setTargetAtTime(enabled ? 0.05 : 0, ctx.currentTime, 0.6)
  if (airGain) airGain.gain.setTargetAtTime(0, ctx.currentTime, 0.3)
  if (master) master.gain.setTargetAtTime(enabled ? MASTER : 0, ctx.currentTime, 0.3)
}

export function useSoundscape() {
  return {
    get enabled() { return enabled },
    get ready() { return started && !!ctx },
    resume,
    toggle() {
      /* 首次点击：浏览器还没解锁音频 → 直接开启（而不是静音） */
      if (!ctx) {
        enabled = true
        localStorage.setItem(KEY, 'on')
        resume()
        return true
      }
      applyMute(enabled)
      if (enabled) tone(PENTATONIC[2], 0.6, 0.05, { attack: 0.12 })
      return enabled
    },
    /* 柔和铃音（章节入场 / 按钮点击 / 剧情推进）：基音 + 五度 + 八度 + 高音微光 */
    chime(i = 0, gain = 0.075) {
      const f = PENTATONIC[Math.max(0, Math.min(PENTATONIC.length - 1, i))]
      tone(f, 2.1, gain, { attack: 0.06 })
      tone(f * 1.5, 1.6, gain * 0.38, { delay: 0.06, attack: 0.08 })
      tone(f * 2, 1.2, gain * 0.18, { delay: 0.12, attack: 0.1 })
      tone(f * 3, 0.9, gain * 0.07, { delay: 0.16, attack: 0.12 })
      noiseBurst(0.55, 0.012, 3600, 5400, 2.2)
    },
    /* 卡片掠过 / 幕帘转场的气流声 */
    whoosh(strength = 1) {
      noiseBurst(0.44, 0.032 * strength, 360, 1600, 0.9)
    },
    /* 幕帘全屏转场：更大的上行气流 + 低音回响 */
    swell() {
      noiseBurst(1.2, 0.058, 200, 2200, 0.8)
      tone(174.61, 1.5, 0.045, { glideTo: 349.23, attack: 0.14 })
      tone(1046.5, 1.4, 0.022, { delay: 0.16, attack: 0.2 })
    },
    /* 细微 UI 触碰声 */
    tick() {
      tone(2093, 0.09, 0.019, { attack: 0.012 })
    },
    /* 点击物理装饰：向上弹起的圆润音 */
    pop() {
      tone(700, 0.34, 0.05, { type: 'triangle', glideTo: 1320, attack: 0.02 })
      tone(1400, 0.22, 0.016, { glideTo: 2100, attack: 0.02 })
    },
    /* 落地弹跳：低闷但柔软的撞击 */
    thud(v = 1) {
      noiseBurst(0.2, 0.025 * v, 300, 100, 0.8)
      tone(104, 0.3, 0.035 * v, { glideTo: 62, attack: 0.01 })
    },
    /* 指针移动的空气声（0~1，由速度换算） */
    air(v: number) {
      if (!ctx || !airGain || !enabled) return
      airGain.gain.setTargetAtTime(Math.min(0.03, v * 0.03), ctx.currentTime, 0.2)
    },
    /* 滚动推进时极轻的音量漂移，强化「旅程前行」 */
    journey(p: number) {
      if (!ctx || !padGain || !enabled) return
      padGain.gain.setTargetAtTime(0.042 + p * 0.018, ctx.currentTime, 0.9)
    }
  }
}
