<footer id="footer">
 <div class="footer-col-1">
  <div class="main-links">
   <a class="footer-link disabled" href="#/" id="footer-about-us">
    About Us
   </a>
   <a class="footer-link" href="{ globalThis.urlRoutes["home.home"] }" id="footer-home">
    Home
   </a>
   <a class="footer-link" href="{ globalThis.urlRoutes["home.gallery"] }" id="footer-gallery">
    Gallery
   </a>
   <a class="footer-link disabled" href="#/" id="footer-blogs">
    Guidance Documents
   </a>
   <div class="footer-link-width">
    Guidance Documents
   </div>
  </div>
  <div class="mobile-col-2">
   <a class="footer-link disabled" href="#/" id="footer-tos">
    Terms of Service
   </a>
   <a class="footer-link disabled" href="#/" id="footer-conduct">
    Code of Conduct
   </a>
  </div>
 </div>
 <div class="footer-col-2">
  <a class="disabled footer-link" href="#/" id="footer-tos">
   Terms of Service
  </a>
  <a class="disabled footer-link" href="#/" id="footer-conduct">
   Code of Conduct
  </a>
 </div>
 <div class="footer-col-3">
  <div class="social-links">
   <a class="footer-social-link" href="https://www.linkedin.com/in/gabor-molnar-89848111/
">
    <ion-icon name="logo-linkedin">
    </ion-icon>
   </a>
   <!-- <a href="#" class="footer-social-link"><ion-icon name="logo-github"></ion-icon></a>
                    <a href="#" class="footer-social-link"><ion-icon name="logo-youtube"></ion-icon></a>
                    <a href="#" class="footer-social-link"><ion-icon name="logo-discord"></ion-icon></a> -->
  </div>
  <div class="contact-info">
   Structural-design.eu
   <br/>
   Operated by:
   <br/>
   Gabor Molnar Engineering Design
   <br/>
   Gray Office Park
   <br/>
   Galway Retail Park
   <br/>
   Headford Rd
   <br/>
   Galway H91 C9XH
   <br/>
   T. 091/511-458
   <br/>
   E. info@structural-design.eu
  </div>
 </div>
</footer>

<style>
/*general.cssFooter309123*/
footer {
  display: flex;
  position: relative;
  background-color: #303030;
  justify-content: space-between;
  padding: 20px 40px;
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
  color: #d1d1d1;
  margin: 3px 0px;
  text-decoration: underline;
  display: block;
  transition: color 0.15s, letter-spacing 0.15s;
}
.footer-link.disabled {
  pointer-events: none;
  color: #d1d1d1 !important;
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
  color: #d1d1d1;
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
  color: #d1d1d1;
}
/*general-query.cssFooter512241*/
@media only screen and (max-width: 640px) {
  .footer-col-2 {
    display: none;
  }
  .mobile-col-2 {
    margin-top: auto;
    display: block;
  }
}
@media only screen and (max-width: 500px) {
  footer {
    display: block;
  }
  .footer-col-3 {
    text-align: center;
    width: 100%;
  }
  .social-links {
    position: absolute;
    top: 20px;
    right: 40px;
  }
  .contact-info {
    justify-content: center;
    text-align: center;
    margin-top: 30px;
  }
  .footer-col-1 {
    flex-direction: row;
    justify-content: space-between;
  }
  .mobile-col-2 {
    text-align: right;
  }
}
@media only screen and (max-width: 390px) {
  .footer-col-1 {
    flex-direction: column;
    text-align: center;
    margin-top: 35px;
  }
  .mobile-col-2 {
    margin-top: 15px;
    text-align: center;
  }
  .social-links {
    text-align: center;
    right: 0;
    width: 100%;
  }
  footer {
    padding: 20px 10px;
  }
}

</style>
