<div class="bg">
  <div class="bg-1"></div>
  <div class="overlay"></div>
</div>

<style>
  .bg {
    position: absolute;
    width: 100vw;
    height: 100vh;
    isolation: isolate;
    z-index: -1;
  }
  .bg .overlay {
    position: absolute;
    top: 0;
    height: 100%;
    width: 100%;
    background: var(--secondary);
    mix-blend-mode: color;
  }

  .bg-1 {
    position: absolute;
    z-index: -1;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(
        to top,
        var(--secondary) 0%,
        transparent 10%,
        white 70%,
        white 100%
      ),
      url(/auth/register/noise.svg);
    filter: contrast(170%) brightness(100%);
  }
</style>
