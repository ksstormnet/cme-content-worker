/**
 * Shared Components for Blog Templates
 * Contains reusable components that are shared between listing pages and blog post pages
 */

export class SharedComponents {

  /**
   * Generate sticky top bar (used on both listing and blog post pages)
   */
  static generateStickyTopBar(): string {
    return `
<div class="gb-element-6d98b3bd hide-on-mobile">
  <div class="gb-element-a31c4cb5">
    <div class="gb-element-0db34a8b">
      <div class="gb-element-047d3b1f">
        <figure class="wp-block-image size-full">
          <a href="/">
            <img alt="Cruise Made Easy Logo" decoding="async" width="132" height="54" 
                 sizes="(max-width: 132px) 100vw, 132px"
                 src="https://cruisemadeeasy.com/wp-content/uploads/2025/02/Small-Wrods-White-over-no-color-126x85-1.png" 
                 class="wp-image-5901"/>
          </a>
        </figure>
      </div>
      
      <div class="gb-element-7653835a">
        <a class="gb-text gb-text-fe08e03c" href="/which-cruiser-are-you">
          🧭 <strong>Cruise Match Quiz</strong>
        </a>
        
        <a class="gb-text gb-text-c882862d" href="https://cruisemadeeasy.com/cruise-planning-services/">
          <strong>🧳 Plan My Cruise</strong>
        </a>
        
        <a class="gb-text gb-text-8e5e6e91" href="/cruise-planning/">
          🧠 <strong>Tips &amp; Guides</strong>
        </a>
        
        <a class="gb-text gb-text-bcd02962" href="https://connect.cruisemadeeasy.com/widget/bookings/talk_travel" 
           target="_blank" rel="noopener nofollow">
          <strong>Start the Conversation</strong>
        </a>
        
        <p class="gb-text-bd574af4">
          <span class="gb-shape">
            <svg viewBox="0 0 16 16" class="bi bi-phone" fill="currentColor" height="16" width="16" xmlns="https://www.w3.org/2000/svg">
              <path d="M11 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6zM5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H5z"></path>
              <path d="M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path>
            </svg>
          </span>
          <span class="gb-text">
            <a href="tel:+13163750200" data-type="tel" data-id="tel:+13163750200">Call / text (316) 375-0200</a>
          </span>
        </p>
      </div>
    </div>
  </div>
</div>`;
  }

  /**
   * Generate site header (used on both listing and blog post pages)
   */
  static generateSiteHeader(): string {
    return `
<header class="site-header has-inline-mobile-toggle" id="masthead" aria-label="Site" itemtype="https://schema.org/WPHeader" itemscope>
  <div class="inside-header grid-container">
    <nav class="main-navigation mobile-menu-control-wrapper" id="mobile-menu-control-wrapper" aria-label="Mobile Toggle">
      <div class="menu-bar-items">
        <!-- Mobile navigation controls would be enhanced here -->
      </div>
    </nav>
  </div>
</header>`;
  }

  /**
   * Generate complete footer (used on both listing and blog post pages)
   */
  static generateFooter(): string {
    return `
<div class="site-footer">
  <div class="gb-element-8850b7bc alignwide">
    <div>
      <div class="gb-element-c56a38e3"></div>
      
      <div>
        <div class="gb-element-299e3421">
          
          <!-- Logo and tagline -->
          <div class="gb-element-99528bfa">
            <div class="gb-element-e458cc94">
              <div class="wp-block-image">
                <figure class="aligncenter size-full is-resized">
                  <img alt="" loading="lazy" decoding="async" width="1221" height="1112"
                       sizes="auto, (max-width: 1221px) 100vw, 1221px"
                       src="https://cruisemadeeasy.com/wp-content/uploads/2025/07/white-svg-vertical.svg" 
                       alt="" class="wp-image-7512" 
                       style="object-fit:cover;width:132px;height:107px"/>
                </figure>
              </div>
              <p class="has-text-align-center" style="font-size:16px">
                <strong>Helping You Cruise Smarter,<br>One Trip at a Time</strong>
              </p>
            </div>
          </div>

          <!-- Legal Links -->
          <div class="gb-element-02d88715">
            <h4 class="gb-text gb-text-1e906952">Legal</h4>
            <nav class="is-vertical wp-block-navigation is-layout-flex" aria-label="Navigation">
              <ul class="wp-block-navigation__container is-vertical wp-block-navigation">
                <li class="wp-block-navigation-item wp-block-navigation-link">
                  <a class="wp-block-navigation-item__content" href="https://cruisemadeeasy.com/client-agreement-summary/">
                    <span class="wp-block-navigation-item__label">Summary of Terms</span>
                  </a>
                </li>
                <li class="wp-block-navigation-item wp-block-navigation-link">
                  <a class="wp-block-navigation-item__content" href="https://cruisemadeeasy.com/detailed-tracvel-tc/">
                    <span class="wp-block-navigation-item__label">Full Terms &amp; Conditions</span>
                  </a>
                </li>
                <li class="wp-block-navigation-item wp-block-navigation-link">
                  <a class="wp-block-navigation-item__content" href="https://cruisemadeeasy.com/privacy-policy/">
                    <span class="wp-block-navigation-item__label">Privacy Policy</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <!-- Social Links -->
          <div class="gb-element-73c7971f">
            <h4 class="gb-text gb-text-64a2c0e9">Social</h4>
            <ul class="wp-block-social-links has-icon-color is-style-logos-only is-layout-flex">
              <li class="wp-social-link wp-social-link-facebook has-base-3-color wp-block-social-link">
                <a rel="noopener nofollow" target="_blank" href="https://facebook.com/CruiseMadeEasy" 
                   class="wp-block-social-link-anchor">
                  <svg width="24" height="24" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7C18.3 21.1 22 17 22 12c0-5.5-4.5-10-10-10z"></path>
                  </svg>
                  <span class="wp-block-social-link-label screen-reader-text">Facebook</span>
                </a>
              </li>

              <li class="wp-social-link wp-social-link-x has-base-3-color wp-block-social-link">
                <a rel="noopener nofollow" target="_blank" href="https://x.com/CruiseMadeEasy" 
                   class="wp-block-social-link-anchor">
                  <svg width="24" height="24" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <path d="M13.982 10.622 20.54 3h-1.554l-5.693 6.618L8.745 3H3.5l6.876 10.007L3.5 21h1.554l6.012-6.989L15.868 21h5.245l-7.131-10.378Zm-2.128 2.474-.697-.997-5.543-7.93H8l4.474 6.4.697.996 5.815 8.318h-2.387l-4.745-6.787Z" />
                  </svg>
                  <span class="wp-block-social-link-label screen-reader-text">X</span>
                </a>
              </li>

              <li class="wp-social-link wp-social-link-instagram has-base-3-color wp-block-social-link">
                <a rel="noopener nofollow" target="_blank" href="https://instagram.com/CruiseMadeEasy" 
                   class="wp-block-social-link-anchor">
                  <svg width="24" height="24" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <path d="M12,4.622c2.403,0,2.688,0.009,3.637,0.052c0.877,0.04,1.354,0.187,1.671,0.31c0.42,0.163,0.72,0.358,1.035,0.673 c0.315,0.315,0.51,0.615,0.673,1.035c0.123,0.317,0.27,0.794,0.31,1.671c0.043,0.949,0.052,1.234,0.052,3.637 s-0.009,2.688-0.052,3.637c-0.04,0.877-0.187,1.354-0.31,1.671c-0.163,0.42-0.358,0.72-0.673,1.035 c-0.315,0.315-0.615,0.51-1.035,0.673c-0.317,0.123-0.794,0.27-1.671,0.31c-0.949,0.043-1.233,0.052-3.637,0.052 s-2.688-0.009-3.637-0.052c-0.877-0.04-1.354-0.187-1.671-0.31c-0.42-0.163-0.72-0.358-1.035-0.673 c-0.315-0.315-0.51-0.615-0.673-1.035c-0.123-0.317-0.27-0.794-0.31-1.671C4.631,14.688,4.622,14.403,4.622,12 s0.009-2.688,0.052-3.637c0.04-0.877,0.187-1.354,0.31-1.671c0.163-0.42,0.358-0.72,0.673-1.035 c0.315-0.315,0.615-0.51,1.035-0.673c0.317-0.123,0.794-0.27,1.671-0.31C9.312,4.631,9.597,4.622,12,4.622 M12,3 C9.556,3,9.249,3.01,8.289,3.054C7.331,3.098,6.677,3.25,6.105,3.472C5.513,3.702,5.011,4.01,4.511,4.511 c-0.5,0.5-0.808,1.002-1.038,1.594C3.25,6.677,3.098,7.331,3.054,8.289C3.01,9.249,3,9.556,3,12c0,2.444,0.01,2.751,0.054,3.711 c0.044,0.958,0.196,1.612,0.418,2.185c0.23,0.592,0.538,1.094,1.038,1.594c0.5,0.5,1.002,0.808,1.594,1.038 c0.572,0.222,1.227,0.375,2.185,0.418C9.249,20.99,9.556,21,12,21s2.751-0.01,3.711-0.054c0.958-0.044,1.612-0.196,2.185-0.418 c0.592-0.23,1.094-0.538,1.594-1.038c0.5-0.5,0.808-1.002,1.038-1.594c0.222-0.572,0.375-1.227,0.418-2.185 C20.99,14.751,21,14.444,21,12s-0.01-2.751-0.054-3.711c-0.044-0.958-0.196-1.612-0.418-2.185c-0.23-0.592-0.538-1.094-1.038-1.594 c-0.5-0.5-1.002-0.808-1.594-1.038c-0.572-0.222-1.227-0.375-2.185-0.418C14.751,3.01,14.444,3,12,3L12,3z M12,7.378 c-2.552,0-4.622,2.069-4.622,4.622S9.448,16.622,12,16.622s4.622-2.069,4.622-4.622S14.552,7.378,12,7.378z M12,15 c-1.657,0-3-1.343-3-3s1.343-3,3-3s3,1.343,3,3S13.657,15,12,15z M16.804,6.116c-0.596,0-1.08,0.484-1.08,1.08 s0.484,1.08,1.08,1.08c0.596,0,1.08-0.484,1.08-1.08S17.401,6.116,16.804,6.116z"></path>
                  </svg>
                  <span class="wp-block-social-link-label screen-reader-text">Instagram</span>
                </a>
              </li>

              <li class="wp-social-link wp-social-link-pinterest has-base-3-color wp-block-social-link">
                <a rel="noopener nofollow" target="_blank" href="https://pinterest.com/CruiseMadeEasy" 
                   class="wp-block-social-link-anchor">
                  <svg width="24" height="24" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <path d="M12.289,2C6.617,2,3.606,5.648,3.606,9.622c0,1.846,1.025,4.146,2.666,4.878c0.25,0.111,0.381,0.063,0.439-0.169 c0.044-0.175,0.267-1.029,0.365-1.428c0.032-0.128,0.017-0.237-0.091-0.362C6.445,11.911,6.01,10.75,6.01,9.668 c0-2.777,2.194-5.464,5.933-5.464c3.23,0,5.49,2.108,5.49,5.122c0,3.407-1.794,5.768-4.13,5.768c-1.291,0-2.257-1.021-1.948-2.277 c0.372-1.495,1.089-3.112,1.089-4.191c0-0.967-0.542-1.775-1.663-1.775c-1.319,0-2.379,1.309-2.379,3.059 c0,1.115,0.394,1.869,0.394,1.869s-1.302,5.279-1.54,6.261c-0.405,1.666,0.053,4.368,0.094,4.604 c0.021,0.126,0.167,0.169,0.25,0.063c0.129-0.165,1.699-2.419,2.142-4.051c0.158-0.59,0.817-2.995,0.817-2.995 c0.43,0.784,1.681,1.446,3.013,1.446c3.963,0,6.822-3.494,6.822-7.833C20.394,5.112,16.849,2,12.289,2"></path>
                  </svg>
                  <span class="wp-block-social-link-label screen-reader-text">Pinterest</span>
                </a>
              </li>

              <li class="wp-social-link wp-social-link-linkedin has-base-3-color wp-block-social-link">
                <a rel="noopener nofollow" target="_blank" href="https://linkedin.com/company/CruiseMadeEasy" 
                   class="wp-block-social-link-anchor">
                  <svg width="24" height="24" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <path d="M19.7,3H4.3C3.582,3,3,3.582,3,4.3v15.4C3,20.418,3.582,21,4.3,21h15.4c0.718,0,1.3-0.582,1.3-1.3V4.3 C21,3.582,20.418,3,19.7,3z M8.339,18.338H5.667v-8.59h2.672V18.338z M7.004,8.574c-0.857,0-1.549-0.694-1.549-1.548 c0-0.855,0.691-1.548,1.549-1.548c0.854,0,1.547,0.694,1.547,1.548C8.551,7.881,7.858,8.574,7.004,8.574z M18.339,18.338h-2.669 v-4.177c0-0.996-0.017-2.278-1.387-2.278c-1.389,0-1.601,1.086-1.601,2.206v4.249h-2.667v-8.59h2.559v1.174h0.037 c0.356-0.675,1.227-1.387,2.526-1.387c2.703,0,3.203,1.779,3.203,4.092V18.338z"></path>
                  </svg>
                  <span class="wp-block-social-link-label screen-reader-text">LinkedIn</span>
                </a>
              </li>

              <li class="wp-social-link wp-social-link-chain has-base-3-color wp-block-social-link">
                <a rel="noopener nofollow" target="_blank" href="https://boards.cruisecritic.com/profile/1335996-plainsstormchaser/" 
                   class="wp-block-social-link-anchor">
                  <svg width="24" height="24" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <path d="M15.6,7.2H14v1.5h1.6c2,0,3.7,1.7,3.7,3.7s-1.7,3.7-3.7,3.7H14v1.5h1.6c2.8,0,5.2-2.3,5.2-5.2,0-2.9-2.3-5.2-5.2-5.2zM4.7,12.4c0-2,1.7-3.7,3.7-3.7H10V7.2H8.4c-2.9,0-5.2,2.3-5.2,5.2,0,2.9,2.3,5.2,5.2,5.2H10v-1.5H8.4c-2,0-3.7-1.7-3.7-3.7zm4.6.9h5.3v-1.5H9.3v1.5z"></path>
                  </svg>
                  <span class="wp-block-social-link-label screen-reader-text">Cruise Critic</span>
                </a>
              </li>
            </ul>
          </div>
          
        </div>

        <!-- Copyright -->
        <div class="gb-element-ca7c77e9">
          <p class="has-text-align-center has-small-font-size">
            Affiliated with WorldVia Travel Network, a Travel Leaders Network Associate<br>
            © 2025 Sky+Sea LLC d/b/a Cruise Made EASY! • Some images used under License From NCLH, Inc.
          </p>
        </div>
        
      </div>
    </div>
  </div>
</div>

<footer class="site-info">
  <div class="inside-site-info grid-container">
  </div>
</footer>

<style>
/* Gray text area controls height - image adjusts to fit */
.generate-columns-container {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-gap: 30px;
  margin: 0 30px;
  margin-bottom: 30px; /* Add padding between articles and footer */
  align-items: start; /* Allow items to size naturally */
}

.generate-columns-container article {
  display: block; /* Let content flow naturally */
}

/* Background image container adjusts to content */
.generate-columns-container article .gb-element-947acc35 {
  display: block;
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 200px; /* Minimum height for image area */
}

/* Gray text area has equal heights and controls overall card size */
.generate-columns-container article .gb-element-ca29c3cc {
  /* This will be set to equal heights by JavaScript */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px; /* Ensure consistent padding */
  background-color: rgba(36,36,36,0.49);
  border-bottom-right-radius: 10px;
  width: 60%;
  position: relative;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .generate-columns-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin: 0 20px;
    grid-gap: 20px;
  }
  
  .generate-columns-container article .gb-element-ca29c3cc {
    width: 90%;
  }
}

@media (max-width: 480px) {
  .generate-columns-container {
    grid-template-columns: 1fr;
    margin: 0 15px;
    grid-gap: 15px;
  }
  
  .generate-columns-container article .gb-element-ca29c3cc {
    width: 100%;
  }
}

/* Blog post specific styles */
.breadcrumb-nav {
  margin: 20px 0;
  padding: 0 30px;
}

.breadcrumb {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
}

.breadcrumb li {
  margin-right: 10px;
}

.breadcrumb li:not(:last-child)::after {
  content: "›";
  margin-left: 10px;
  color: #666;
}

.breadcrumb a {
  color: var(--accent);
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.entry-header {
  margin-bottom: 30px;
  text-align: center;
}

.entry-title {
  font-size: 2.5em;
  margin-bottom: 15px;
  color: var(--contrast);
}

.entry-meta {
  color: #666;
  font-size: 0.9em;
}

.post-author {
  margin-left: 15px;
}

.entry-content {
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
  padding: 0 30px;
}

.entry-content h2,
.entry-content h3,
.entry-content h4 {
  margin-top: 30px;
  margin-bottom: 15px;
  color: var(--contrast);
}

.entry-content p {
  margin-bottom: 20px;
}

.cat-links {
  display: inline-flex;
  align-items: center;
  margin-top: 30px;
}

.cat-links .gp-icon {
  margin-right: 5px;
}

.cat-links a {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
}

.cat-links a:hover {
  text-decoration: underline;
}

/* Post navigation styles */
.paging-navigation {
  margin: 40px 0;
  padding: 0 30px;
}

.gb-element-8babdb99 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.gb-element-2245e1ea,
.gb-element-3a7edbd3 {
  display: flex;
  align-items: center;
  max-width: 45%;
}

.gb-element-2245e1ea img,
.gb-element-3a7edbd3 img {
  border-radius: 8px;
  margin: 0 15px;
}

.gb-element-2245e1ea a,
.gb-element-3a7edbd3 a {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
}

.gb-element-2245e1ea a:hover,
.gb-element-3a7edbd3 a:hover {
  text-decoration: underline;
}

/* Category pills for listing pages */
.category-pills-container {
  text-align: center;
  margin: 30px 0;
  padding: 0 30px;
}

.category-pill {
  display: inline-block;
  padding: 8px 16px;
  margin: 5px;
  background-color: var(--base-2);
  color: var(--contrast);
  text-decoration: none;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 600;
  transition: all 0.3s ease;
}

.category-pill:hover,
.category-pill-active {
  background-color: var(--accent);
  color: var(--base-3);
}
</style>

<script>
// Equalize gray text area heights - they control the overall card size
(function() {
  function equalizeGrayTextAreas() {
    console.log('Equalizing gray text areas...');
    
    const textAreas = document.querySelectorAll('.generate-columns-container .gb-element-ca29c3cc');
    console.log('Found gray text areas:', textAreas.length);
    
    if (textAreas.length === 0) return;
    
    // Reset heights first
    textAreas.forEach(area => {
      area.style.height = '';
      area.style.minHeight = '';
    });
    
    // Force layout recalculation
    document.body.offsetHeight;
    
    // Wait a moment, then measure and equalize
    setTimeout(() => {
      let maxHeight = 0;
      const heights = [];
      
      textAreas.forEach((area, index) => {
        const height = area.offsetHeight;
        heights.push(height);
        console.log('Gray text area', index, 'height:', height);
        if (height > maxHeight) {
          maxHeight = height;
        }
      });
      
      console.log('Max gray area height found:', maxHeight);
      console.log('All gray area heights:', heights);
      
      if (maxHeight > 0) {
        textAreas.forEach((area, index) => {
          area.style.height = maxHeight + 'px';
          console.log('Set gray area', index, 'to height:', maxHeight);
        });
        console.log('Equal gray text area heights applied!');
      }
    }, 100);
  }
  
  // Run after DOM and images load
  if (document.readyState === 'complete') {
    equalizeGrayTextAreas();
  } else {
    window.addEventListener('load', equalizeGrayTextAreas);
  }
  
  // Also run after a delay
  setTimeout(equalizeGrayTextAreas, 1500);
  
  // Handle resize
  window.addEventListener('resize', function() {
    setTimeout(equalizeGrayTextAreas, 200);
  });
})();
</script>

</body>
</html>`;
  }

  /**
   * Format category slug to display name
   */
  static formatCategoryName(slug: string): string {
    return slug.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Escape HTML special characters
   */
  static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}