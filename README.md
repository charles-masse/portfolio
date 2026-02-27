![How the outlines used to look like](/../gh-images/outline.png)
Started by using [Sobel](https://gist.github.com/Hebali/6ebfc66106459aacee6a9fac029d0115), but can be achieved by simply comparing a colorId pass.
Was creating slightly thicker edge when objects overlapped, use 2 passes instead--outline + dilation.
