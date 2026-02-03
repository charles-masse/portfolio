# Portfolio [WIP]
I always wanted an interactive Crowd portfolio where, instead of being just a few seconds of curated footage, visitors could actually *stress-test* the behaviors I usually use in my crowds. I feel it would let visitors see, firsthand, the intricacy in the work I'm producing.

## Goals
- [Display a decent amount of visually distinct characters on screen](#How-to-manage-lots-of-characters-on-screen)
- [Create an interesting environment for these characters to interact with](#An-interesting-environment)

## How to manage lots of characters on screen
Obviously, it's Crowd—you need a lot of characters, but it's also the scariest part.
My website needs to run well on most computers and smartphones and the last thing I want is to lose an opportunity because my website was lagging on a recruiters' phone.


Here's what I did to overcome these hurdles :

### Stylized over Realistic
The *Uncanny Valley* is a tough hill to climb and the results often age badly. Instead, I opted for a stylized look as I feel, if done right, doesn't age as quickly and doesn't require as much ressources to make it look nice. 

I got really inspired by **Valve**'s promotional material for <ins>Portal 2</ins> : simple pictogram characters, but full of personality. They can be achieved with a low amount of polygons, variations can be a simple texture swap and they don't need to be affected by lights since they're a flat black color.

![A pictogram character from the Portal 2 trailers waving to the camera](/../gh-images/portal2.gif)

For the environment, I went with something similar. Super minimalistic shapes to keep it low poly and white textures not to distract too much from the crowd. The only compromise I opted for is enabling shadows to create depth and contrast.

![A minimalist city with hard shadows](/../gh-images/city.jpg)

### Instanced characters
A more technical way to handle a large number of objects in **Three.js** is to use a single [instanced mesh](https://threejs.org/docs/?q=instancedMes#InstancedMesh) with X instances, instead of cloning the same object X times.
Here's the results of a test I did on my machine with 10 000 cloned [Suzannes](https://commons.wikimedia.org/wiki/File:Suzanne.stl#/media/File:Suzanne.stl) vs 10 000 instances of [Suzanne](https://commons.wikimedia.org/wiki/File:Suzanne.stl#/media/File:Suzanne.stl):

|                     | Cloned (min-max)  | Instanced (min-max) |
|---------------------|-------------------|---------------------|
| **FPS**             | 13-23             | 39-43               |
| **Frame Time (ms)** | 3-776             | 2-81                |
| **Memory (mb)**     | 130-282           | 9-20                |

As you can see, the max FPS is nearly doubled with the instances, they load 10x faster and use less than 10% of the cloned memory.
The only problem, every instanced characters must look the same and play the same animation...

### GL Shaders
Like mentioned before, instances comes with a major constrain—they all need to be indentical. Pretty hard to create an interesting crowd when everyone looks and acts the same. This is where custom shaders come into play.

## An interesting environment

### Showcase the typical crowd behaviors

### Be interesting on phones and computers

## Special Thanks
- [Mugen87](https://github.com/Mugen87) for the [Yuka Game AI library](https://github.com/Mugen87/yuka)
- [isaac-mason](https://github.com/isaac-mason) for their [NavMesh Generator](https://navmesh.isaacmason.com)