<script>
  import logo from "./assets/logo.svg";
</script>

<nav>
  <div class="logo">
    <img src={logo} alt="Gabor Molnar Engineering" />
  </div>
  <div class="rhs">
    <div class="line" />
    <div class="search">
      <ion-icon name="search" />
      <!-- TODO: Upon pressing enter, or clicking "search-btn", go to results -->
      <input type="text" placeholder="Search..." />
      <div class="search-btn">
        <ion-icon name="return-up-forward" />
      </div>
    </div>
    <div class="account">
      {#if !globalThis.loggedIn}
        <!-- TODO: Make these more visually attractive by making them do stuff on hover and click -->
        <button class="login">Sign In</button>
        <div class="divider" />
        <button class="register">Sign Up</button>
        <!-- TODO: Display for when user is logged in -->
      {/if}
    </div>
  </div>
</nav>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap");
  /* TODO: Making it responsive */
  nav {
    display: flex;
    position: fixed;
    top: 0;
    width: 100%;
    height: 55px;
    background: #ffffffd1;
  }
  nav .logo {
    margin-right: auto;
    height: 70px;
    width: 70px;
    margin: 10px 0 0 10px;
  }
  nav .logo img {
    height: 100%;
    width: 100%;
    position: relative;
  }
  nav .logo::before {
    display: inline-block;
    background: linear-gradient(
      0deg,
      #ffffffd1 0%,
      #ffffffd1 38%,
      #0000 38%,
      #0000 100%
    );
    content: "";
    height: inherit;
    width: inherit;
    position: absolute;
    border-radius: 9999px;
    padding: var(--padding-amount);
    --padding-amount: 8px;
    transform: translate(
      calc(-1 * var(--padding-amount)),
      calc(-1 * var(--padding-amount))
    );
  }

  nav .rhs {
    width: calc(100% - 100px);
    margin-left: auto;
    position: relative;
    display: flex;
    /* box-shadow: 10px 4px 6px -1px #dedede; */
    /* box-shadow: inset 0 -16px 7px -10px #dedede; */
  }
  nav .rhs .line {
    position: absolute;
    width: 100%;
    height: 2px;
    /* background-color: #727272;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(114, 114, 114, 0.887628378988314) 31%,
      rgba(114, 114, 114, 1) 100%
    );
    bottom: 0; */
  }

  nav .search {
    padding: 0 10px;
    margin: auto;
    flex-grow: 1;
    position: relative;
    display: flex;
    padding-right: 20px;
    max-width: 570px;
  }
  nav .search input {
    width: 100%;
    height: 32px;
    border: 1px solid black;
    border-bottom-left-radius: 3px;
    border-top-left-radius: 3px;
    box-shadow: inset 0 0 0 3px #ededed;
    outline: 0px solid #ededed;
    box-sizing: border-box;
    padding: 0 5px 0 30px;
    font-size: 115%;
    font-family: "Source Code Pro", monospace;
    transition: box-shadow 0.15s, outline 0.15s;
  }
  nav .search input:focus {
    box-shadow: inset 0 0 #ededed;
    outline: 4px solid #ededed;
  }
  nav .search ion-icon {
    position: absolute;
    font-size: 130%;
    height: 100%;
    left: 15px;
    color: #515151;
  }
  nav .search .search-btn {
    position: relative;
    width: 40px;
    background: #787878;
    border-bottom-right-radius: 3px;
    border-top-right-radius: 3px;
    padding: 5px;
    box-sizing: border-box;
    text-decoration: underline;
    box-shadow: inset 1px 2px 3px #a0a0a0, inset -1px -1px 3px #181818;
  }
  nav .search .search-btn:hover {
    background: #424242;
    cursor: pointer;
  }
  nav .search .search-btn ion-icon {
    color: #fff;
    width: calc(100% - 10px);
    left: 5px;
    box-sizing: border-box;
    height: calc(100% - 10px);
  }

  nav .account {
    margin: auto 0;
    padding-right: 10px;
    position: relative;
    cursor: default;
  }
  nav .account .login,
  nav .account .register {
    height: 32px;
    border: 0;
    background: 0;
    font-size: 100%;
    text-decoration: underline;
    cursor: pointer;
    color: rgb(85, 85, 85);
    font-family: liberation-sans, sans-serif;
  }
  .divider {
    display: inline-block;
    position: absolute;
    height: 100%;
    width: 1px;
    background: #bababa;
    transform: translateX(-1px) rotate(15deg);
  }
</style>
