# Portfolio [WIP]
I always wanted an interactive Crowd portfolio where, instead of being just a few seconds of curated footage, visitors could actually stress-test the behaviors I usually use in my crowds. I feel it would let visitors see, firsthand, the intricacy in the work I'm producing.

## Goals
- [Display a decent amount of visually distinct characters on screen](#How-to-manage-lots-of-characters-on-screen)
- [Create an interesting environment for these characters to interact with](#An-interesting-environment)

## How to manage lots of characters on screen
Obviously, it's Crowd—you need lots of characters, but it's also the scariest part.
My website needs to run well on most computers and smartphones and the last thing I want is to lose an opportunity because my website was lagging on a recruiters' phone.
Here's what I did to overcome these hurdles :

### Stylized over Realistic


### Instanced characters
A more technical way to handle a large number of objects in *Three.js* is to use a single [instanced mesh](https://threejs.org/docs/?q=instancedMes#InstancedMesh) with X instances, instead of cloning the same object X times.
Here's the results of a test I did on my machine with 10 000 cloned [Suzannes](https://en.wikipedia.org/wiki/Blender_(software)#Suzanne) vs 10 000 instances of [Suzanne](https://en.wikipedia.org/wiki/Blender_(software)#Suzanne) :

|                     | Cloned (min-max)  | Instanced (min-max) |
|---------------------|-------------------|---------------------|
| **FPS**             | 13-23             | 39-43               |
| **Frame Time (ms)** | 3-776             | 2-81                |
| **Memory (mb)**     | 130-282           | 9-20                |

As you can see, the max FPS is nearly doubled with the instances, they load 10x faster and use less than 10% of the cloned memory.
The only problem, every instanced characters must look the same and play the same animation...

### GL Shaders
Like mentioned before, instances comes with a major constrain—they all need to be indentical. Pretty hard to create an interesting crowd when everyone looks and acts the same, but what if there was a way to add a layer of variation on top. This is where custom shaders come into play.

## An interesting environment

### Showcase the typical crowd behaviors.

### Be interesting on a phone and a computer