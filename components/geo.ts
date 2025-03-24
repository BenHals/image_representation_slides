export interface AnimationStage<S> {
    state: S,
    sp: number,
    ep: number
}

export interface Animation<S> {
    totalDuration: number,
    stages: AnimationStage<S>[]
}

interface Point {
    x: number,
    y: number
}

export interface WorldPoint extends Point { }
export interface WorldPropPoint extends Point { }
export interface ViewportPoint extends Point { }

export interface World {
    tl: WorldPoint
    w: number,
    h: number,
}

export interface Viewport {
    tl: WorldPoint
    w: number,
    h: number,
    s: number,
    sharpness: number
}

/**
* Converts a world proportional point (in terms of 0 - 1.0)
* to absolute coords
*/
export function toWorldAbsolute(p: WorldPropPoint, w: World): WorldPoint {
    return {
        x: w.tl.x + p.x * w.w,
        y: w.tl.y + p.y * w.h
    }
}

export function worldToViewport(p: WorldPoint, w: World, v: Viewport): ViewportPoint {
    let offset = { x: w.tl.x - v.tl.x, y: w.tl.y - v.tl.y }
    return {
        x: (p.x + offset.x) * viewportScaling(v),
        y: (p.y + offset.y) * viewportScaling(v)
    }
}

/**
* Gets a scaling constant to handle viewport scale vs sharpness (number of pixels per 'pixel')
*/
export function viewportScaling(v: Viewport): number {
    return v.sharpness / v.s
}
