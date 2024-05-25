<script lang="ts">
  import "./style.css";
  import { fetch_ } from "/shared/helper";

  let count = $state(0);
  let username = $state("");

  function increment() {
    count += 1;
  }
</script>

<div class="bg"></div>
<div class="card-wrapper">
  <div class="card">
    <h1 class="text-3xl font-bold underline">Hello world!</h1>
  </div>
</div>

<style>
  @import url("https://fonts.googleapis.com/css?family=IM%20Fell%20Great%20Primer%20SC:700|IM%20Fell%20Great%20Primer%20SC:400");

  .bg {
    position: absolute;
    width: 100vw;
    height: 100vh;
    z-index: -1;
    background: #e9e9e9;
  }
  .card-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100vw;
    height: 100vh;
  }
  .card {
    width: 70%;
    max-width: 500px;
    height: 90%;
    background-color: #fff;
    border-radius: 10px;
    border: 2px solid var(--text);
    box-shadow: 5px -5px 20px -3px #aeaeae;
    padding: 5px;
  }

  /* h1 {
    text-align: center;
    letter-spacing: 2px;
    font-size: 3em;
    margin: 0;
    color: var(--text);
    font-family: "IM Fell Great Primer SC";
  } */
</style>
