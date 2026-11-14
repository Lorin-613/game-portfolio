import Matter from 'matter-js'
import { useSoundscape } from './useSoundscape'

/* ═══ Matter.js 物理：点击装饰物 → 脱离漂浮 → 重力掉落弹跳 → 消散重生 ═══
   单例引擎懒启动；transform 写入与 CursorFairy 的 .px 视差通过 data-physics 互斥 */

type CharmItem = {
  el: HTMLElement
  body: Matter.Body
  rect: DOMRect
  css: string
  fading: boolean
  timer: ReturnType<typeof setTimeout> | null
}

let engine: Matter.Engine | null = null
let items: CharmItem[] = []
let rafId = 0
let running = false
let floorB: Matter.Body | null = null
let leftB: Matter.Body | null = null
let rightB: Matter.Body | null = null

function placeWalls() {
  if (!floorB || !leftB || !rightB) return
  const w = window.innerWidth, h = window.innerHeight
  Matter.Body.setPosition(floorB, { x: w / 2, y: h + 40 })
  Matter.Body.setPosition(leftB, { x: -40, y: h / 2 })
  Matter.Body.setPosition(rightB, { x: w + 40, y: h / 2 })
}

function ensureEngine() {
  if (engine) return
  engine = Matter.Engine.create()
  const w = window.innerWidth, h = window.innerHeight
  floorB = Matter.Bodies.rectangle(w / 2, h + 40, w * 3, 80, { isStatic: true })
  leftB = Matter.Bodies.rectangle(-40, h / 2, 80, h * 3, { isStatic: true })
  rightB = Matter.Bodies.rectangle(w + 40, h / 2, 80, h * 3, { isStatic: true })
  Matter.Composite.add(engine.world, [floorB, leftB, rightB])
  window.addEventListener('resize', placeWalls, { passive: true })

  /* 落地弹跳音：按撞击速度给音量，带冷却避免连击爆音 */
  let lastThud = 0
  Matter.Events.on(engine, 'collisionStart', (ev: any) => {
    const now = performance.now()
    if (now - lastThud < 110) return
    for (const p of ev.pairs) {
      const speed = Math.max(Math.abs(p.bodyA.velocity.y), Math.abs(p.bodyB.velocity.y))
      if (speed > 2.2) {
        lastThud = now
        useSoundscape().thud(Math.min(1, speed / 11))
        break
      }
    }
  })
}

function loop() {
  if (!engine) return
  Matter.Engine.update(engine, 1000 / 60)
  for (const it of items) {
    if (it.fading) continue
    const { x, y } = it.body.position
    const dx = x - (it.rect.left + it.rect.width / 2)
    const dy = y - (it.rect.top + it.rect.height / 2)
    it.el.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) rotate(${it.body.angle.toFixed(3)}rad)`
  }
  if (running) rafId = requestAnimationFrame(loop)
}

function startLoop() {
  if (running) return
  running = true
  rafId = requestAnimationFrame(loop)
}

function respawn(item: CharmItem, gsap: any) {
  if (!engine) return
  Matter.Composite.remove(engine.world, item.body)
  items = items.filter(i => i !== item)
  const el = item.el
  /* 恢复掉落前的 inline 样式（父组件通过 style 传入的定位） */
  el.style.cssText = item.css
  /* 归位弹回：pop 期间仍锁定 .px 视差写入，结束后再交还 */
  gsap.fromTo(el, { opacity: 0, scale: 0.4 }, {
    opacity: 1, scale: 1, duration: 0.75, ease: 'back.out(1.8)',
    onComplete: () => {
      gsap.set(el, { clearProps: 'opacity,transform' })
      delete el.dataset.physics
    }
  })
}

function drop(el: HTMLElement, gsap: any) {
  if (el.dataset.physics === '1') return
  ensureEngine()
  useSoundscape().pop()
  const rect = el.getBoundingClientRect()
  const css = el.style.cssText
  el.dataset.physics = '1'
  Object.assign(el.style, {
    position: 'fixed',
    left: rect.left + 'px',
    top: rect.top + 'px',
    margin: '0',
    zIndex: '1600'
  })
  el.style.transform = 'none'
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const body = Matter.Bodies.circle(cx, cy, Math.max(rect.width, rect.height) / 2, {
    restitution: 0.55, friction: 0.02, frictionAir: 0.008
  })
  Matter.Body.setVelocity(body, { x: Math.random() * 4 - 2, y: 2 })
  Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2)
  Matter.Composite.add(engine!.world, body)
  const item: CharmItem = { el, body, rect, css, fading: false, timer: null }
  items.push(item)
  startLoop()
  item.timer = setTimeout(() => {
    item.fading = true
    gsap.to(el, {
      opacity: 0, scale: 0.45, duration: 0.5, ease: 'power2.in',
      onComplete: () => respawn(item, gsap)
    })
  }, 2600)
}

export function usePhysicsCharm() {
  const { $gsap } = useNuxtApp() as any
  const { reduceMotion, isTouch } = useMotionPrefs()

  function attach(el: HTMLElement) {
    el.addEventListener('click', () => {
      if (reduceMotion || !$gsap) return
      if (isTouch) {
        /* 触屏保留点击跳动（无指针视差写入，transform 无冲突） */
        if (el.dataset.physics === '1') return
        el.dataset.physics = '1'
        useSoundscape().pop()
        $gsap.timeline({ onComplete: () => { $gsap.set(el, { clearProps: 'transform' }); delete el.dataset.physics } })
          .to(el, { y: -30, duration: 0.26, ease: 'power2.out' })
          .to(el, { y: 0, duration: 0.55, ease: 'bounce.out' })
        return
      }
      drop(el, $gsap)
    })
  }

  return { attach }
}
