<script setup lang="ts">

import { ref, onMounted, shallowRef } from 'vue'

interface SimulationState {
  x: number,
  y: number
}

interface AnimationStage {
  state: SimulationState,
  sp: number,
  ep: number
}

interface Animation {
  totalDuration: number,
  stages: AnimationStage[]
}

function createAnimation(): Animation {
  let stages: AnimationStage[] = []
  let curr_state = {
    x: 0.0,
    y: 0.0,
  }
  let prev_p = 0.0
  let curr_p = 0.0

  stages.push({ state: { ...curr_state }, sp: prev_p, ep: curr_p })

  while (curr_p < 1.0) {
    prev_p = curr_p
    curr_p = Math.min(1.0, curr_p + Math.random())

    curr_state = { x: Math.random(), y: Math.random() }
    stages.push({ state: { ...curr_state }, sp: prev_p, ep: curr_p })
  }

  stages.push({ state: { ...stages[stages.length - 1].state }, sp: 1.0, ep: 1.0 })

  return {
    totalDuration: 3.0,
    stages: stages
  }

}

const customCanvas = shallowRef<HTMLCanvasElement | null>(null)
const ctx = shallowRef<CanvasRenderingContext2D | null>(null)
const progSlider = ref<HTMLInputElement | null>(null)
const prog = ref(0.0)
const isPlaying = ref(false)
const aniStartTime = ref<number | null>(null)

const ani = createAnimation()
console.log(ani)



onMounted(() => {
  customCanvas.value!.width = customCanvas.value!.clientWidth
  customCanvas.value!.height = customCanvas.value!.clientHeight
  ctx.value = customCanvas.value!.getContext('2d')
  draw(sim(prog.value))
})

function sim(p: number): SimulationState {
  let w = customCanvas.value!.width
  let h = customCanvas.value!.height
  console.log(w, h, p)
  const min_x = 0.0;
  const min_y = 0.0;
  const max_x = w;
  const max_y = h;

  let prev_ani_stages = ani.stages.filter((s) => s.ep <= p)
  let next_ani_stages = ani.stages.filter((s) => s.ep >= p)
  console.log(prev_ani_stages)
  console.log(next_ani_stages)
  let curr_stage = next_ani_stages[0]
  let prev_stage = prev_ani_stages[prev_ani_stages.length - 1]

  console.log(curr_stage)
  console.log(prev_stage)
  let stage_p = (curr_stage.ep - curr_stage.sp) > 0 ? (p - curr_stage.sp) / (curr_stage.ep - curr_stage.sp) : curr_stage.ep
  console.log(stage_p)
  let xp = (1 - stage_p) * prev_stage.state.x + stage_p * curr_stage.state.x
  let yp = (1 - stage_p) * prev_stage.state.y + stage_p * curr_stage.state.y


  return {
    x: (1 - xp) * min_x + xp * max_x,
    y: (1 - yp) * min_y + yp * max_y,
  }
}

function draw(state: SimulationState) {
  let w = customCanvas.value!.width
  let h = customCanvas.value!.height
  ctx.value?.clearRect(0, 0, w, h)

  ctx.value?.fillRect(state.x - 50, state.y - 50, 100, 100)
}

function move() {
  prog.value = parseFloat(progSlider.value!.value)
  prog.value = Math.min(prog.value, 1.0)
  draw(sim(prog.value))

}

function start() {
  if (prog.value >= 1.0) prog.value = 0.0
  isPlaying.value = true
  aniStartTime.value = null
  requestAnimationFrame(inc)
}

function end() {
  isPlaying.value = false
}

function inc(time: number) {
  let deltaTime = 0.0
  if (aniStartTime.value === null) {
    aniStartTime.value = time
  } else {
    deltaTime = (time - aniStartTime.value);
    aniStartTime.value = time
  }
  let prodDelta = deltaTime / (ani.totalDuration * 1000)

  if (!isPlaying.value) return
  prog.value += prodDelta
  let hit_end = prog.value >= 1.0
  prog.value = Math.min(prog.value, 1.0)
  draw(sim(prog.value))

  if (hit_end) isPlaying.value = false

  if (isPlaying.value) {
    requestAnimationFrame(inc)
  }

}

console.log('test')

</script>

<template>
  <div flex="~ col" border="~ main rounded-md" style="width: 100%; height: 400px;">
    <canvas ref="customCanvas" id='test' @click="move" style="image-rendering: pixelated; width: 100%; height: 100%;">
    </canvas>
    <div flex="~ row">
      <div style="width: 20%">
        <button v-if="isPlaying" @click="end">Stop</button>
        <button v-else @click="start">Start</button>
      </div>
      <div style="width: 75%">
        <input type="range" min=0.0 max=1.0 step=0.01 :value="prog" ref="progSlider" @input="move"
          style="width: 100%"></input>
      </div>
    </div>
  </div>
</template>
