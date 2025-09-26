import React, { useState } from 'react';

interface StickyHeaderProps {
  // Add any props needed for customization
}

export function StickyHeader({}: StickyHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleCruiseQuiz = () => {
    window.open('/which-cruiser-are-you', '_self');
  };

  const handlePlanCruise = () => {
    window.open('https://cruisemadeeasy.com/cruise-planning-services/', '_blank');
  };

  const handleTipsGuides = () => {
    window.open('/cruise-planning/', '_self');
  };

  const handleStartConversation = () => {
    window.open('https://connect.cruisemadeeasy.com/widget/bookings/talk_travel', '_blank');
  };

  const handlePhoneCall = () => {
    window.open('tel:+13163750200', '_self');
  };

  return (
    <div className="header-wrap">
      <a className="screen-reader-text skip-link" href="#content" title="Skip to content">
        Skip to content
      </a>
      
      {/* Desktop Header - Using exact GenerateBlocks structure */}
      <div className="gb-element-6d98b3bd hide-on-mobile">
        <div className="gb-element-a31c4cb5">
          <div className="gb-element-0db34a8b">
            <div className="gb-element-047d3b1f">
              <figure className="wp-block-image size-full">
                <a href="https://cruisemadeeasy.com/">
                  <img 
                    alt="" 
                    decoding="async" 
                    width="132" 
                    height="54" 
                    sizes="(max-width: 132px) 100vw, 132px" 
                    src="https://cruisemadeeasy.com/wp-content/uploads/2025/02/Small-Wrods-White-over-no-color-126x85-1.png" 
                    className="wp-image-5901"
                  />
                </a>
              </figure>
            </div>

            <div className="gb-element-7653835a">
              <a className="gb-text gb-text-fe08e03c" href="/which-cruiser-are-you" onClick={(e) => { e.preventDefault(); handleCruiseQuiz(); }}>
                🧭 <strong>Cruise Match Quiz</strong>
              </a>

              <a className="gb-text gb-text-c882862d" href="https://cruisemadeeasy.com/cruise-planning-services/" onClick={(e) => { e.preventDefault(); handlePlanCruise(); }}>
                <strong>🧳 <strong>PLan My Cruise</strong></strong>
              </a>

              <a className="gb-text gb-text-8e5e6e91" href="/cruise-planning/" onClick={(e) => { e.preventDefault(); handleTipsGuides(); }}>
                🧠 <strong>Tips &amp; Guides</strong>
              </a>

              <a className="gb-text gb-text-bcd02962" href="https://connect.cruisemadeeasy.com/widget/bookings/talk_travel" target="_blank" rel="noopener nofollow" onClick={(e) => { e.preventDefault(); handleStartConversation(); }}>
                <strong>Start the Conversation</strong>
              </a>

              <p className="gb-text-bd574af4">
                <span className="gb-shape">
                  <svg viewBox="0 0 16 16" className="bi bi-phone" fill="currentColor" height="16" width="16" xmlns="https://www.w3.org/2000/svg">   
                    <path d="M11 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6zM5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H5z" />   
                    <path d="M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                  </svg>
                </span>
                <span className="gb-text">
                  <a href="tel:+13163750200" data-type="tel" data-id="tel:+13163750200" onClick={(e) => { e.preventDefault(); handlePhoneCall(); }}>
                    Call / text (316) 375-0200
                  </a>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <header className="site-header has-inline-mobile-toggle" id="masthead" aria-label="Site" itemType="https://schema.org/WPHeader" itemScope>
        <div className="inside-header grid-container">
          <nav className="main-navigation mobile-menu-control-wrapper" id="mobile-menu-control-wrapper" aria-label="Mobile Toggle">
            <div className="menu-bar-items">
              <style>
                {`
                  @media (max-width: 768px) {
                    .top-bar {
                      display: none !important;
                    }
                  }

                  @media (min-width: 769px) {
                    .mobile-bar {
                      display: none !important;
                    }
                  }
                  
                  /* Overall layout: left block (stacked), right hamburger */
                  .mobile-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                    width: 100%;
                  }

                  /* Stack quiz + phone vertically */
                  .mobile-cta-stack {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 0.25rem;
                  }

                  /* Individual link styling */
                  .mobile-cta,
                  .mobile-phone-link {
                    font-weight: 600;
                    text-decoration: none;
                    font-size: 15px;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    color: #ffffff;
                  }

                  /* Icon alignment if needed (optional) */
                  .mobile-phone-link::before {
                    content: "☎️ ";
                    margin-right: 0.4em;
                  }

                  /* Hamburger stays right and centered */
                  .generate-toggle {
                    display: flex;
                    align-items: center;
                    margin-left: auto;
                  }
                `}
              </style>

              <div className="mobile-bar">
                <div className="mobile-cta-stack">
                  <a href="/which-cruiser-are-you" className="mobile-cta" onClick={(e) => { e.preventDefault(); handleCruiseQuiz(); }}>
                    🧭 Cruise Match Quiz
                  </a>
                  <a href="tel:+13163750200" className="mobile-phone-link" onClick={(e) => { e.preventDefault(); handlePhoneCall(); }}>
                    Call or Text
                  </a>
                </div>
                <div className="generate-toggle">
                  <button 
                    data-nav="site-navigation" 
                    className="menu-toggle" 
                    aria-controls="generate-slideout-menu" 
                    aria-expanded={mobileMenuOpen}
                    onClick={toggleMobileMenu}
                  >
                    <span className="gp-icon icon-menu-bars">
                      <svg viewBox="0 0 512 512" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em">
                        <path d="M0 96c0-13.255 10.745-24 24-24h464c13.255 0 24 10.745 24 24s-10.745 24-24 24H24c-13.255 0-24-10.745-24-24zm0 160c0-13.255 10.745-24 24-24h464c13.255 0 24 10.745 24 24s-10.745 24-24 24H24c-13.255 0-24-10.745-24-24zm0 160c0-13.255 10.745-24 24-24h464c13.255 0 24 10.745 24 24s-10.745 24-24 24H24c-13.255 0-24-10.745-24-24z" />
                      </svg>
                      <svg viewBox="0 0 512 512" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em">
                        <path d="M71.029 71.029c9.373-9.372 24.569-9.372 33.942 0L256 222.059l151.029-151.03c9.373-9.372 24.569-9.372 33.942 0 9.372 9.373 9.372 24.569 0 33.942L289.941 256l151.03 151.029c9.372 9.373 9.372 24.569 0 33.942-9.373 9.372-24.569 9.372-33.942 0L256 289.941l-151.029 151.03c-9.373 9.372-24.569 9.372-33.942 0-9.372-9.373-9.372-24.569 0-33.942L222.059 256 71.029 104.971c-9.372-9.373-9.372-24.569 0-33.942z" />
                      </svg>
                    </span>
                    <span className="screen-reader-text">Menu</span>
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* Mobile Navigation Header */}
          <nav id="mobile-header" itemType="https://schema.org/SiteNavigationElement" itemScope className="main-navigation mobile-header-navigation has-branding has-sticky-branding has-menu-bar-items">
            <div className="inside-navigation grid-container grid-parent">
              <div className="site-logo mobile-header-logo">
                <a href="https://cruisemadeeasy.com/" title="Cruise Made Easy" rel="home">
                  <img 
                    src="https://cruisemadeeasy.com/wp-content/uploads/2025/02/Small-Wrods-White-over-no-color-126x85-1.png" 
                    alt="Cruise Made Easy" 
                    className="is-logo-image" 
                    width="132" 
                    height="54" 
                  />
                </a>
              </div>
              <button 
                className="menu-toggle" 
                aria-controls="mobile-menu" 
                aria-expanded={mobileMenuOpen}
                onClick={toggleMobileMenu}
              >
                <span className="gp-icon icon-menu-bars">
                  <svg viewBox="0 0 512 512" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em">
                    <path d="M0 96c0-13.255 10.745-24 24-24h464c13.255 0 24 10.745 24 24s-10.745 24-24 24H24c-13.255 0-24-10.745-24-24zm0 160c0-13.255 10.745-24 24-24h464c13.255 0 24 10.745 24 24s-10.745 24-24 24H24c-13.255 0-24-10.745-24-24zm0 160c0-13.255 10.745-24 24-24h464c13.255 0 24 10.745 24 24s-10.745 24-24 24H24c-13.255 0-24-10.745-24-24z" />
                  </svg>
                  <svg viewBox="0 0 512 512" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em">
                    <path d="M71.029 71.029c9.373-9.372 24.569-9.372 33.942 0L256 222.059l151.029-151.03c9.373-9.372 24.569-9.372 33.942 0 9.372 9.373 9.372 24.569 0 33.942L289.941 256l151.03 151.029c9.372 9.373 9.372 24.569 0 33.942-9.373 9.372-24.569 9.372-33.942 0L256 289.941l-151.029 151.03c-9.373 9.372-24.569 9.372-33.942 0-9.372-9.373-9.372-24.569 0-33.942L222.059 256 71.029 104.971c-9.372-9.373-9.372-24.569 0-33.942z" />
                  </svg>
                </span>
                <span className="screen-reader-text">Menu</span>
              </button>
            </div>
          </nav>
        </div>
      </header>
    </div>
  );
}