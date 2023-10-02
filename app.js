import { default as seagulls } from './seagulls.js'
import { default as Video } from './video.js'

const sg = await seagulls.init(),
    frag = await seagulls.import( './frag.wgsl' ),
    shader = seagulls.constants.vertex + frag

await Video.init()

const BRIGHTNESS_THRESHOLD = 0.45
let screen_brightness = 0

const video_canvas = document.createElement("canvas")
const video_ctx = video_canvas.getContext("2d", {willReadFrequently: true})
video_canvas.width = Video.element.videoWidth
video_canvas.height = Video.element.videoHeight 

let click_pos = [0, 0]
window.onclick = (e) => {
    time_since_click = 0
    sg.uniforms.click_pos = [e.clientX, e.clientY]
}
let time_since_click = 0

const resolution = [ window.innerWidth, window.innerHeight ]
let frame = 0

let threshold = 0.5
let noise_scale = 50;
window.onkeydown = (e) => {
    if (e.keyCode == 37 && threshold > 0) {
        threshold -= 0.05
        sg.uniforms.threshold = threshold
    } else if (e.keyCode == 39 && threshold < 1) {
        threshold += 0.05
        sg.uniforms.threshold = threshold
    } else if (e.keyCode == 38) {
        noise_scale += 5;
        sg.uniforms.noise_scale = noise_scale;
    } else if (e.keyCode == 40) {
        noise_scale -= 5;
        sg.uniforms.noise_scale = noise_scale;
    }
}

sg
    .uniforms({ frame, resolution, screen_brightness})
    .onframe( () => {
        sg.uniforms.frame = frame++
        sg.uniforms.time_since_click = time_since_click++

        video_ctx.drawImage(Video.element, 0, 0)
        const image_data = video_ctx.getImageData(0, 0, video_canvas.width, video_canvas.height)
        let total_brightness = 0
        for (let i = 0; i < image_data.data.byteLength; i += 4) {
            total_brightness += (image_data.data[i] + image_data.data[i+1] + image_data.data[i+2]) / 765
        }
        total_brightness /= image_data.data.byteLength / 4
        sg.uniforms.screen_brightness = total_brightness
    })
    .textures([ Video.element ])
    .render( shader )
    .run()