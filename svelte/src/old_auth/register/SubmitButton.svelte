<script>
  // @ts-nocheck

  export let text;
  export let disabled = false;
  let isActive = false;
</script>

<input
  class={isActive ? "active" : ""}
  type="submit"
  value={text}
  {disabled}
  on:mouseleave={function () {
    isActive = false;
    setTimeout(() => this.style.removeProperty("transition"), 0);
  }}
  on:mouseup={function () {
    isActive = false;
    setTimeout(() => this.style.removeProperty("transition"), 0);
  }}
  on:mousedown={function () {
    this.style.transition = "box-shadow 0s, transform 0s";
    setTimeout(() => (isActive = true), 0);
  }}
/>

<style>
  input[type="submit"] {
    /* margin-top: 25px; */
    padding: 3px 15px;
    background: #fff;
    border: 2px solid #d5d5d5;
    border-radius: 5px;
    color: #ababab;
    font-weight: bold;
    transition: box-shadow 0.2s, transform 0.2s;
  }
  input[type="submit"]:hover {
    box-shadow: 3px 3px 0 0 #d5d5d5;
    transform: translate(-3px, -3px);
    cursor: pointer;
  }
  input[type="submit"].active {
    background: rgb(241, 241, 241);
    transform: translate(0px, 0px);
    box-shadow: 0px 0px 0 0 #d5d5d5;
  }
  input[type="submit"]:disabled {
    opacity: 0.5;
    cursor: default;
    box-shadow: none;
    transform: none;
  }
</style>
