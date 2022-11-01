<script>
  import StickyNavigation from "./../../shared/lib/StickyNavigation.svelte";
  import Footer from "./../../shared/lib/Footer.svelte";
</script>

<main>
  <StickyNavigation />
  <div class="space" />
  <h3>Contents of this page</h3>
  <ul>
    <li>Sign up to our newsletter (dismissable)</li>
    <li>Recently viewed, OR bookmarked(?) guidance documents</li>
    <li>"View ALL documents" button</li>
    <li>Recently added guidance documents</li>
  </ul>
  <div
    class="space"
    style="background-image: url(https://imgur.com/QAMZ7Pm.png);"
  />
  <div class="space" />
  <Footer />
</main>

<style>
  .space {
    height: 100vh;
  }
</style>
