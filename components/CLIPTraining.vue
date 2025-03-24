<script setup lang="ts">

import { ref, onMounted, shallowRef } from 'vue'
import * as geo from './geo.ts'


interface TrainExampleDS {
  tl: geo.WorldPropPoint,
  o: number
}
interface SimulationState {
  trainDataset: TrainExampleDS[],
}


function createAnimation(): geo.Animation<SimulationState> {
  const n_train_examples = 5
  let stages: geo.AnimationStage<SimulationState>[] = []
  let curr_state = {
    trainDataset: [...Array(n_train_examples).keys()].map((i) => {
      return {
        o: 0.0,
        tl: { x: 0.01, y: 0.1 * (i + 1) }
      }
    })
  }
  let prev_p = 0.0
  let curr_p = 0.0
  console.log("first", curr_state)

  stages.push({ state: { ...curr_state }, sp: prev_p, ep: curr_p })
  curr_state = structuredClone(curr_state)

  for (const i in [...Array(n_train_examples).keys()]) {
    prev_p = curr_p
    curr_p = Math.min(1.0, curr_p + 0.1)

    console.log(curr_state)
    curr_state.trainDataset[i].o = 1.0
    stages.push({ state: curr_state, sp: prev_p, ep: curr_p })
    curr_state = structuredClone(curr_state)
  }

  stages.push({ state: { ...stages[stages.length - 1].state }, sp: 1.0, ep: 1.0 })

  return {
    totalDuration: 3.0,
    stages: stages
  }

}

let world = {
  tl: { x: 0.0, y: 0.0 },
  w: 0.0,
  h: 0.0,
}

let viewport = {
  tl: { x: 0.0, y: 0.0 },
  w: 0.0,
  h: 0.0,
  s: 1.0,
  sharpness: 2.0
}

const customCanvas = shallowRef<HTMLCanvasElement | null>(null)
const ctx = shallowRef<CanvasRenderingContext2D | null>(null)
const progSlider = ref<HTMLInputElement | null>(null)
const prog = ref(0.0)
const isPlaying = ref(false)
const aniStartTime = ref<number | null>(null)
let handleDrag = false

const ani = createAnimation()
console.log(ani)

function handleResize() {
  customCanvas.value!.width = customCanvas.value!.clientWidth * viewport.sharpness
  customCanvas.value!.height = customCanvas.value!.clientHeight * viewport.sharpness
  world.w = customCanvas.value!.width / viewport.sharpness
  world.h = customCanvas.value!.height / viewport.sharpness
  viewport.w = customCanvas.value!.width * viewport.s
  viewport.h = customCanvas.value!.height * viewport.s
}

onMounted(() => {
  handleResize()
  ctx.value = customCanvas.value!.getContext('2d')
  customCanvas.value!.onmousedown = () => { handleDrag = true }
  customCanvas.value!.onmouseup = () => { handleDrag = false }
  customCanvas.value!.onmousemove = (e: MouseEvent) => {
    if (!handleDrag) return;

    const bb = customCanvas.value!.getBoundingClientRect();

    const propMovementX = (e.movementX / bb.width) * customCanvas.value!.width
    const propMovementY = (e.movementY / bb.height) * customCanvas.value!.height

    viewport.tl.x += -propMovementX * 1 / geo.viewportScaling(viewport);
    viewport.tl.y += -propMovementY * 1 / geo.viewportScaling(viewport);
    draw(sim(prog.value));
  }

  customCanvas.value!.onwheel = (e) => {
    const scaleDelta = e.deltaY * 0.001 * viewport.s
    let scaleChange = (viewport.s + scaleDelta) / viewport.s

    const bb = customCanvas.value!.getBoundingClientRect();
    const x = viewport.tl.x + Math.floor((e.clientX - bb.left) / bb.width * (customCanvas.value!.width * viewport.s / viewport.sharpness));
    const y = viewport.tl.y + Math.floor((e.clientY - bb.top) / bb.height * (customCanvas.value!.height * viewport.s / viewport.sharpness));

    console.log(viewport, x, y)
    viewport.s *= scaleChange
    viewport.tl.x = x - (x - viewport.tl.x) * (scaleChange)
    viewport.tl.y = y - (y - viewport.tl.y) * (scaleChange)
    console.log(viewport, x, y)
    // console.log(viewport.tl.x, x)
    // console.log(viewport.tl.y, y)
    // viewport.tl.x = x
    // viewport.tl.y = y



    draw(sim(prog.value))



  }
  draw(sim(prog.value))
})

function sim(p: number): SimulationState {
  let prev_ani_stages = ani.stages.filter((s) => s.ep <= p)
  let next_ani_stages = ani.stages.filter((s) => s.ep >= p)
  let curr_stage = next_ani_stages[0]
  let prev_stage = prev_ani_stages[prev_ani_stages.length - 1]

  let stage_p = (curr_stage.ep - curr_stage.sp) > 0 ? (p - curr_stage.sp) / (curr_stage.ep - curr_stage.sp) : curr_stage.ep

  let s = geo.lerpObj(prev_stage.state, curr_stage.state, stage_p)

  return s
}

function draw(state: SimulationState) {
  console.log("draw")
  handleResize()
  console.log(ctx.value)
  console.log(world, viewport)
  let world_vp = geo.worldToViewport(world.tl, world, viewport)
  ctx.value!.resetTransform()
  ctx.value?.clearRect(0.0, 0.0, viewport.w, viewport.h)
  ctx.value!.setTransform(geo.viewportScaling(viewport), 0, 0, geo.viewportScaling(viewport), world_vp.x, world_vp.y)

  console.log(state.trainDataset)
  // draw Dataset
  const datasetBoxTl = geo.toWorldAbsolute({ x: 0.005, y: 0.090 }, world)
  console.log(datasetBoxTl)

  ctx.value!.strokeStyle = `rgba(0, 0, 0, 1.0)`
  ctx.value!.lineWidth = 2
  ctx.value!.beginPath()
  ctx.value!.roundRect(
    datasetBoxTl.x,
    datasetBoxTl.y,
    0.11 * world.w,
    (state.trainDataset.length * 0.1 + 0.02) * world.h,
    6
  )
  ctx.value!.stroke()
  // ctx.value!.strokeRect(
  //   datasetBoxTl.x,
  //   datasetBoxTl.y,
  //   0.11 * world.w,
  //   (state.trainDataset.length * 0.1 + 0.02) * world.h
  // )

  ctx.value!.fillStyle = `rgba(0, 0, 0, 1.0)`
  ctx.value!.fillText("Dataset", datasetBoxTl.x, datasetBoxTl.y - 0.01 * world.h)

  for (const te of state.trainDataset) {
    // Outer box
    let rect_wp = geo.toWorldAbsolute(te.tl, world)
    ctx.value!.strokeStyle = `rgba(0, 0, 0, ${te.o})`

    ctx.value!.beginPath()
    ctx.value!.roundRect(
      rect_wp.x,
      rect_wp.y,
      0.1 * world.w,
      0.1 * world.h,
      6
    )
    ctx.value!.stroke()
    // ctx.value?.strokeRect(rect_wp.x, rect_wp.y, 0.1 * world.w, 0.1 * world.h)

    // Img icon
    ctx.value!.strokeStyle = `rgba(34, 139, 230, ${te.o})`
    let im_wp = geo.toWorldAbsolute({ x: te.tl.x + 0.01, y: te.tl.y + 0.01 }, world)

    ctx.value!.beginPath()
    ctx.value!.roundRect(
      im_wp.x,
      im_wp.y,
      0.03 * world.w,
      0.08 * world.h,
      6
    )
    ctx.value!.stroke()
    // ctx.value?.strokeRect(im_wp.x, im_wp.y, 0.03 * world.w, 0.08 * world.h)

    // Caption Icon
    ctx.value!.strokeStyle = `rgba(255, 146, 43, ${te.o})`
    ctx.value!.fillStyle = `rgba(255, 146, 43, ${te.o})`
    let cap_wp = geo.toWorldAbsolute({ x: te.tl.x + 0.05, y: te.tl.y + 0.03 }, world)
    // ctx.value?.strokeRect(cap_wp.x, cap_wp.y, 0.04 * world.w, 0.04 * world.h)
    ctx.value!.beginPath()
    ctx.value!.roundRect(
      cap_wp.x,
      cap_wp.y,
      0.04 * world.w,
      0.04 * world.h,
      6
    )
    ctx.value!.stroke()
    ctx.value!.font = '8px sans-serif'
    ctx.value!.fillText("Caption", cap_wp.x + 0.005*world.w, cap_wp.y + 0.03 * world.h)
  }

  ctx.value!.strokeStyle = `rgba(0, 0, 0, 1.0)`
  ctx.value!.strokeRect(world.tl.x, world.tl.y, world.w, world.h)
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
