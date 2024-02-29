
/*
EXAMPLE USAGE
*
* 
*
Include this script in the parent section where you are using this component: 
<script src="{{ 'intersection-loader.js' | asset_url }}" defer></script>
*
<intersection-loader 
  data-url="/products/{{ product.handle }}"  // the url to render your section in
  data-section-id="quickbuy-widget" // the section you want to render
>
  // you can put an optional loading skeleton in here, or you'll get a lil spinner by default
</intersection-loader>
*/

if (!customElements.get('intersection-loader')) {
  class IntersectionLoader extends HTMLElement {
    constructor() {
      super();
      
      this.url = this.dataset.url;
      this.sectionId = this.dataset.sectionId || false;
    }
    
    connectedCallback() {
      if (!this.sectionId) return;
      
      if (!this.hasChildNodes()) {
        this.classList.add('aspect-[1]', 'relative', 'flex', 'items-center', 'justify-center', 'loading', 'w-full');
        this.innerHTML = `
          <div class="loader">
            <span class="block w-12 h-12">
              <svg class="animate-spin -ml-1 mr-3 h-full w-full text-primaryBrand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          </div>
        `;
      }
      
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.loadFromAPI().then(() => this.observer.unobserve(this));
            }
          })
        },
        { rootMargin: '0px', threshold: 0.1 }
        );
        this.observer.observe(this);
      }
      
      async loadFromAPI() {
        const url = new URL(this.url, window.location.origin);
        const searchParams = new URLSearchParams(url.search);
        searchParams.set('section_id', this.sectionId);
        const urlToFetch = `${url.origin.toString()}${url.pathname.toString()}?${searchParams.toString()}`;
        
        fetch(urlToFetch)
          .then((response) => response.text())
          .then((text) => {
            const temp = document.createElement('div');
            const newNode = document.createElement('div');

            temp.innerHTML = text;
            newNode.innerHTML = temp?.querySelector(`#shopify-section-${this.sectionId}`)?.innerHTML ?? '';
            [...newNode.children].forEach(child => {
              this.before(child);
            });
            
            this.remove();
          });
        
      }
    }
    
    customElements.define('intersection-loader', IntersectionLoader);
  }