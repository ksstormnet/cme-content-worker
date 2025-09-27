import React from 'react';

interface PaginationProps {
  prevPost?: {
    url: string;
    title: string;
    featuredImage: string;
  };
  nextPost?: {
    url: string;
    title: string;
    featuredImage: string;
  };
}

export default function PaginationComponent({ prevPost, nextPost }: PaginationProps) {
  return (
    <div className="paging-navigation">
      <div className="gb-element-d1372a50">
        <div className="gb-element-8babdb99">
          {prevPost && (
            <div className="gb-element-2245e1ea">
              <a href={prevPost.url}>
                <img src={prevPost.featuredImage} alt={prevPost.title} className="dynamic-featured-image" />
              </a>
              <p className="gb-text-df52da50">
                <span className="gb-shape">
                  <svg viewBox="0 0 16 16" className="bi bi-arrow-left" fill="currentColor">
                    <path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"></path>
                  </svg>
                </span>
                <span className="gb-text">
                  <a href={prevPost.url}>{prevPost.title}</a>
                </span>
              </p>
            </div>
          )}
          
          {nextPost && (
            <div className="gb-element-3a7edbd3">
              <p className="gb-text-9a551628">
                <span className="gb-shape">
                  <svg viewBox="0 0 16 16" className="bi bi-arrow-right" fill="currentColor">
                    <path d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"></path>
                  </svg>
                </span>
                <span className="gb-text">
                  <a href={nextPost.url}>{nextPost.title}</a>
                </span>
              </p>
              <a href={nextPost.url}>
                <img src={nextPost.featuredImage} alt={nextPost.title} className="dynamic-featured-image" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}