<script setup lang="ts">
/* ═══ EXPERIENCE 分支剧情 demo（自 legacy 平移，逻辑不变） ═══ */
const { $gsap, $st } = useNuxtApp() as any
const { reduceMotion } = useMotionPrefs()
const { set: setPalette } = useAuroraPalette()
const sfx = useSoundscape()

const whoEl = ref<HTMLElement | null>(null)
const lineEl = ref<HTMLElement | null>(null)
const choicesEl = ref<HTMLElement | null>(null)

type Choice = { t: string; n: number | 'end' }
type Scene = { who: string; line: string; choices: Choice[] }

const scenes: Scene[] = [
  { who: 'Senior', line: 'Hey, could you do us a favor? We\'re shooting a promo video and want to film a "girl with a natural vibe"—the way you stood in the sun just now looked so nice and easygoing!',
    choices: [
      { t: 'Sure, I\'d love to help.', n: 1 },
      { t: 'I\'m better behind the camera…', n: 2 },
      { t: 'Sorry, I\'m not up for it right now.', n: 3 }
    ]},
  { who: 'Senior', line: 'That\'s wonderful. You have a great eye — meet us on the track tomorrow at two.', choices: [{ t: 'See you then.', n: 'end' }]},
  { who: 'Senior', line: 'Perfect — we need someone on editing. It\'s a brilliant learning opportunity.', choices: [{ t: 'I\'ll give it a try.', n: 'end' }]},
  { who: 'Lulu', line: 'It\'s alright. Taking care of yourself is its own kind of courage — and you\'re already doing beautifully.', choices: [{ t: 'Thank you, Lulu.', n: 'end' }]}
]

function typeLine(text: string, cb?: () => void) {
  const line = lineEl.value!
  line.classList.add('fade')
  setTimeout(() => {
    line.innerHTML = ''
    line.classList.remove('fade')
    let i = 0
    let word: HTMLElement | null = null
    const next = () => {
      if (i >= text.length) { if (cb) cb(); return }
      const ch = text[i]
      if (ch === ' ') {
        /* 空格不包 span：inline-block 会把孤立空格压成 0 宽 */
        line.appendChild(document.createTextNode(' '))
        word = null
      } else {
        /* 字符按单词分组，换行只发生在词间，避免单词被拆开 */
        if (!word) {
          word = document.createElement('span')
          word.className = 'w'
          line.appendChild(word)
        }
        const s = document.createElement('span')
        s.className = 'c'
        s.textContent = ch
        s.style.animationDelay = (i * 0.04) + 's'
        word.appendChild(s)
      }
      i++
      setTimeout(next, 42)
    }
    next()
  }, 250)
}

function showChoices(list: Choice[]) {
  const box = choicesEl.value!
  box.innerHTML = ''
  list.forEach((c, i) => {
    const b = document.createElement('button')
    b.className = 'choice'
    b.textContent = c.t
    b.addEventListener('mouseenter', () => sfx.tick())
    setTimeout(() => b.classList.add('show'), 120 + i * 110)
    b.onclick = () => {
      sfx.chime(i + 1, 0.06)
      box.querySelectorAll('.choice').forEach(x => x.classList.remove('picked'))
      b.classList.add('picked')
      setTimeout(() => go(c.n), 700)
    }
    box.appendChild(b)
  })
}

function go(n: number | 'end') {
  const box = choicesEl.value!
  const all = box.querySelectorAll<HTMLElement>('.choice')
  all.forEach((x, i) => {
    setTimeout(() => { x.style.opacity = '0'; x.style.transform = 'translateY(10px)' }, i * 40)
  })
  if (n === 'end') {
    setTimeout(() => {
      box.innerHTML = ''
      whoEl.value!.textContent = 'YONGKOKU'
      typeLine('Every choice leaves a mark on who you become. Many more stories are waiting in YONGKOKU…', () => {
        const b = document.createElement('button')
        b.className = 'choice show'
        b.textContent = 'Experience again'
        b.onclick = () => start()
        setTimeout(() => box.appendChild(b), 300)
      })
    }, all.length * 40 + 200)
    return
  }
  const s = scenes[n]
  setTimeout(() => {
    whoEl.value!.textContent = s.who
    box.innerHTML = ''
    typeLine(s.line, () => showChoices(s.choices))
  }, all.length * 40 + 200)
}

function start() { go(0) }

onMounted(() => {
  start()
  if (reduceMotion || !$gsap || !$st) return
  $st.create({
    trigger: '#experience', start: 'top 55%', end: 'bottom 45%',
    onToggle: (self: any) => {
      if (!self.isActive) return
      setPalette(7)
      sfx.chime(6, 0.055)
    }
  })
})
</script>

<template>
  <section id="experience">
    <div class="wrap">
      <p class="eyebrow rv">Play</p>
      <div class="exp-head">
        <h2 class="title mask-title">Feel the choice</h2>
        <button class="demo-reset" data-magnet @click="start">Restart</button>
      </div>
      <div class="demo rv">
        <div class="demo-scene">
          <div class="demo-art">
            <img class="demo-bg" src="/img/page_story_senior.jpg" alt="Story scene with Senior" loading="lazy" />
          </div>
          <div ref="choicesEl" class="demo-choices"></div>
          <div class="demo-dialog">
            <p ref="whoEl" class="who">Senior</p>
            <p ref="lineEl" class="line"></p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
