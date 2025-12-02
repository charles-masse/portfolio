# Portfolio [WIP]
I always wanted an interactive Crowd portfolio where, instead of being just a few seconds of curated footage, visitors could actually stress-test the behaviors I usually use in my crowds. Scarier for sure, but I feel it would help visitors see, firsthand, the intricacy in the work I'm producing.

## Goals
- Display a decent amount of visually distinct characters on screen.
- Create an interesting environment for these characters to interact with that showcase the typical crowd behaviors.

## How to manage lots of characters on screen
Obviously, it's Crowd, you need a lot of characters--it's also the scariest part. I want my website to run well on most computers and smartphones. The last thing I want is to lose an opportunity because my website was lagging on a recruiters' phone. Here's what I did to overcome these hurdles :

- Stylized over realistic
- Instanced characters
- GL Shaders

### Stylized over realistic

### Instanced characters
A more technical way to handle a large number of objects in a scene is to use a single InstancedMesh with X instances, instead of cloning the same object X times.
Here's the results of a test I did with 10 000 cloned Suzannes (Blender monkey) vs 10 000 instanced Suzannes :
|                     | Cloned (min-max)  | Instanced (min-max) |
|---------------------|-------------------|---------------------|
| **FPS**             | 13-23             | 39-43               |
| **Frame Time** (ms) | 3-776             | 2-81                |
| **Memory** (mb)     | 130-282           | 9-20                |
As you can see, fps is nearly doubled on the instances, loading 10x faster and uses less than 10% of the cloned memory.
The only problem we have with instances, is that every characters must be doing the exact same thing...
### GL Shaders
