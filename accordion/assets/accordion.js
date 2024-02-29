/*
EXAMPLE USAGE
*
* 
*
Include this script in the parent section where you are using this component: 
<script src="{{ 'accordion.js' | asset_url }}" defer></script>
*
<content-accordion data-allow-multiple-active="<bool> // don't close other accordions when you open one"> 
  <ul> // every accordion item renders as `li` element for ADA
    # for item in iterable
    {% liquid 
      render 'component-accordion',
      label<string>: [item.label], // toggle button label
      content<string/html>: [item.content], // the content inside the accordion
      id<string>: [item.unique_id], // must be unique per accordion
      default<bool>: true // optional - pass in to have the accordion item open by default
    %}
  </ul>
</content-accordion>
*/

if (!customElements.get('content-accordion')) {
  // Use to render standard accordions like the snippet above, but with js
  window.renderAccordionItem = ({ attr, label, content, id, isOpenByDefault, icon = 'chevron'}) => `
    <li 
      class="
        ${isOpenByDefault ? 'active' :''} 
        block
        border-lightGrey
        border-t 
        first:border-t-0
        last:border-b 
        [&_.rotate]:transform
        ${icon === 'plus' ? '[&.active_.rotate]:-rotate-90' : '[&.active_.rotate]:-rotate-90'}
        [&:not(.active)_[data-accordion-content]]:max-h-0 
        [&_[data-accordion-content]]:max-h-[var(--accordion-content-height)]
        [&_[data-accordion-content]]:duration-500
        [&_[data-accordion-content]]:transition-all
        [&_[data-accordion-content]]:ease-out
        [&_.rotate]:duration-500
        [&_.rotate]:transition-all
        [&_.rotate]:ease-out
      "
      data-accordion-id="${id}"
      ${attr ? attr : ''}
    >
      <button 
        id="${id}"
        aria-controls="${id}"
        aria-expanded="${isOpenByDefault ? 'true' : 'false'}"
        data-accordion-toggle
        class="flex items-center w-full py-5" type="button" 
        aria-label="Open accordion for ${label}"
        type="button"
      >
        ${label}
        ${icon === 'plus' ? `
          <span aria-hidden="true" class="p-0.5 h-4 w-4 ml-auto relative icon">
            <span class="rotate block w-0.5 h-full absolute left-1/2 top-0 -translate-x-1/2 bg-primaryDark"></span>
            <span class="block w-full h-0.5 absolute top-1/2 left-0 -translate-y-1/2 bg-primaryDark"></span>
          </span>
        ` : `
          <span aria-hidden="true" class="p-0.5 h-4 w-5 ml-auto icon">
            <span class="rotate block w-full h-full">
              <svg style="transform: rotate(90deg);" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 11 19" fill="none">
                <path d="M1 17.5L9 9.5L1 1.5" stroke="currentColor" stroke-width="2"/>
              </svg>
            </span>
          </span>
        `}
      </button>
      <div 
        aria-hidden="${isOpenByDefault ? 'false' : 'true'}"
        id="${id}"
        role="region"
        aria-labelledby="${id}"
        data-accordion-content
        class="overflow-hidden ${isOpenByDefault ? '' : 'hidden'}" 
      >
        <div class="pb-5">
          ${content}
        </div>
      </div>
    </li>
  `;
  
  customElements.define(
    'content-accordion',
    class Accordion extends HTMLElement {
      constructor() {
        super();
      }
    
      connectedCallback() {
        // prep default open accordion height so they close smoothly the first time
        const setDefaultAccordions = () => {
          this.querySelectorAll('[data-accordion-id].active [data-accordion-content]').forEach((contentElement) => {
            contentElement.style.setProperty('--accordion-content-height', `${contentElement.scrollHeight}px`)
          });
        }
        
        // if the children of the accordion are updated, recalculate height vars
        const observer = new MutationObserver(observerCallback.bind(this));
        observer.observe(this, { childList: true, subtree: true });
        
        function observerCallback(mutationList) {
          for (const mutation of mutationList) {
            if (mutation.type === 'childList') {
              setDefaultAccordions();
            }
          }
        }
      
        if (document.readyState === 'complete') {
          setDefaultAccordions();
        } else {
          document.addEventListener('DOMContentLoaded', setDefaultAccordions);
        }
        
        // hide elements, update aria attrs for acccessibility when they have finished transitioning out
        this.addEventListener('transitionend', (e) => {
          const accordionContent = e.target.closest('[data-accordion-id]:not(.active) [data-accordion-content]');
          if (!accordionContent) return;
          
          setTimeout(() => {
            accordionContent.classList.add('hidden');
            accordionContent.setAttribute('aria-hidden', true);
            accordionContent.closest('[data-accordion-id]')
              ?.querySelector('[data-accordion-toggle]')
              ?.setAttribute('aria-expanded', false);
          }, 1);
        });
        
        this.addEventListener('click', (e) => {
          const accordionToggle = e.target.closest('[data-accordion-toggle]');
          if (!accordionToggle) return;
          
          const parentElement = accordionToggle.closest('[data-accordion-id]');
          const contentElement = parentElement.querySelector('[data-accordion-content]');
          const toggleElement = parentElement.querySelector('[data-accordion-toggle]');
          
          // if the accordion is not open, it's about to be. Prep it for a smooth animation/update the aria attrs
          if (!parentElement.classList.contains('active')) {
            contentElement.classList.remove('hidden');
            contentElement.setAttribute('aria-hidden', false);
            toggleElement.setAttribute('aria-expanded', true);
          }
          
          setTimeout(() => {
            // open the current accordion
            contentElement.style.setProperty('--accordion-content-height', `${contentElement.scrollHeight}px`)
            parentElement.classList.toggle('active');

            if (this.dataset.allowMultipleActive === 'true') return;
            // close all the other accordions that might be open
            [...this.querySelectorAll('[data-accordion-id].active')]
              .filter((node) => !node.isSameNode(parentElement))
              .forEach((inactiveParentElement) => {
                inactiveParentElement.classList.remove('active');
                inactiveParentElement.querySelector('[data-accordion-content]')
                  .setAttribute('aria-hidden', true);
                inactiveParentElement.querySelector('[data-accordion-toggle]')
                  .setAttribute('aria-expanded', false);
              });
          }, 1);
        })
      }
    }
  );
}