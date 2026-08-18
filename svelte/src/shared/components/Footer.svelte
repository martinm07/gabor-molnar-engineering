<script lang="ts">
  import "/shared/tailwindinit.css";
</script>

<footer id="footer">
  <div class="footer-col-1">
    <div class="main-links">
      <a href="#/" class="footer-link disabled" id="footer-about-us">About Us</a
      >
      <a href="/" class="footer-link" id="footer-home">Home</a>
      <a href="/gallery" class="footer-link" id="footer-gallery">Gallery</a>
      <a href="/documents" class="footer-link" id="footer-blogs"
        >Guidance Documents</a
      >
      <div class="footer-link-width">Guidance Documents</div>
    </div>
    <div class="mobile-col-2">
      <a href="#/" class="footer-link disabled" id="footer-tos"
        >Terms of Service</a
      >
      <a href="#/" class="footer-link disabled" id="footer-conduct"
        >Code of Conduct</a
      >
    </div>
  </div>
  <div class="footer-col-2">
    <a href="#/" class="disabled footer-link" id="footer-tos"
      >Terms of Service</a
    >
    <a href="#/" class="disabled footer-link" id="footer-conduct"
      >Code of Conduct</a
    >
  </div>
  <div class="footer-col-3">
    <div class="social-links">
      <a
        href="https://www.linkedin.com/in/gabor-molnar-89848111/
"
        class="footer-social-link"
        aria-label="LinkedIn profile"
        ><ion-icon name="logo-linkedin"></ion-icon></a
      >
      <!-- <a href="#" class="footer-social-link"><ion-icon name="logo-github"></ion-icon></a>
                <a href="#" class="footer-social-link"><ion-icon name="logo-youtube"></ion-icon></a>
                <a href="#" class="footer-social-link"><ion-icon name="logo-discord"></ion-icon></a> -->
    </div>
    <div class="contact-info">
      Structural-design.eu<br />
      Operated by:<br />
      Gabor Molnar Engineering Design<br />
      Gray Office Park<br />
      Galway Retail Park<br />
      Headford Rd<br />
      Galway H91 C9XH<br />
      T. 091/511-458<br />
      E.
      <a style="color: inherit" href="mailto:info@structural-design.eu"
        >info@structural-design.eu</a
      >
    </div>
  </div>
</footer>

<style>
  footer {
    display: flex;
    position: relative;
    /*background-color: #303030;*/
    background-color: var(--color-stone-700);
    justify-content: space-between;
    padding: 20px 40px;
    grid-column: 1 / -1;
  }
  .footer-col-1,
  .footer-col-2,
  .footer-col-3 {
    display: flex;
    flex-direction: column;
  }
  .footer-col-2 {
    text-align: center;
    margin-top: auto;
  }
  .mobile-col-2 {
    display: none;
  }
  .footer-col-3 {
    text-align: right;
  }

  .footer-link {
    color: var(--color-stone-300);
    margin: 3px 0px;
    text-decoration: underline;
    display: block;
    transition:
      color 0.15s,
      letter-spacing 0.15s;
  }
  .footer-link.disabled {
    pointer-events: none;
    color: var(--color-stone-300) !important;
    letter-spacing: default !important;
    opacity: 0.5;
  }
  .footer-link:hover {
    color: #fff;
    /* text-decoration: none; */
    letter-spacing: 1px;
  }
  .footer-link-width {
    letter-spacing: 1px;
    opacity: 0;
    cursor: default;
    height: 0;
  }

  .footer-social-link {
    margin: 0 5px;
    color: var(--color-stone-300);
    transition: color 0.15s;
  }
  .footer-social-link:hover {
    color: #31aaff;
  }
  .footer-social-link:hover ion-icon {
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 1) 1%,
      rgba(255, 255, 255, 1) 60%,
      rgba(48, 48, 48, 1) 60%
    );
  }

  .social-links {
    font-size: 150%;
    margin-bottom: 5px;
  }
  .contact-info {
    color: var(--color-stone-300);
  }
  /*endGeneral.cssFooter309123*/
</style>
