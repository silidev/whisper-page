class InfoButton extends HTMLElement {
  private shadow: ShadowRoot;
  private toggleHiddenClass: any;

  constructor() {
    super();
    this.shadow = this.attachShadow({mode: 'open'});
  }

  connectedCallback() {
    const targetId = this.getAttribute('target-id') || 'default-id';
    const moreInfoLinkText = this.getAttribute('moreInfoLinkText') || 'ⓘ';

    this.shadow.innerHTML = `
      <style>
        .hidden {
          display: none;
        }
        :host {
          cursor: pointer;
        }
      </style>
      <span>${moreInfoLinkText}</span>
      <span id="${targetId}" class="hidden">
        <slot></slot>
      </span>
    `;

    this.toggleHiddenClass = () => {
      const targetElement = this.shadow.getElementById(targetId);
      if (targetElement) {
        targetElement.classList.toggle('hidden');
      } else {
        console.error(`Element with id ${targetId} not found`);
      }
    };

    this.addEventListener('click', this.toggleHiddenClass);
  }
}

customElements.define('info-button', InfoButton);