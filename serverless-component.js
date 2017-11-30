function tmpl(strings) {
  const template = document.createElement('template')
  template.innerHTML = strings[0]
  return template
}

const deployableTemplate = tmpl`
  <a style="display: inline-block; text-align: center; padding: 10px; color:black">
    <svg width="48px" height="33px" viewBox="0 0 48 33" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <!-- Generator: Sketch 43.2 (39069) - http://www.bohemiancoding.com/sketch -->
        <desc>Created with Sketch.</desc>
        <defs></defs>
        <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g transform="translate(-5.000000, 0.000000)" id="Fill-1" fill="#000000">
                <path d="M44,13 C42.34,5.68 36.28,0.5 29,0.5 C23.22,0.5 18.2,3.78 15.7,8.58 C9.68,9.22 5,14.32 5,20.5 C5,27.12 10.38,33 17,33 L43,33 C48.52,33 53,28.02 53,22.5 C53,17.22 48.9,12.94 44,13 Z M33,19 L33,27 L25,27 L25,19 L19,19 L29,8.5 L39,19 L33,19 Z"></path>
            </g>
        </g>
    </svg>
    <br>
    <b>Deploy</b>
  </a>
`

const deployingTemplate = tmpl`
  <div style="text-align: center">
    <style>
      @keyframes spin {
        100% {
          transform: rotate(360deg);
        }
      }
    </style>
    <div>
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" style="animation: spin 1s linear infinite;">
        <path d="M32 16c-0.040-2.089-0.493-4.172-1.331-6.077-0.834-1.906-2.046-3.633-3.533-5.060-1.486-1.428-3.248-2.557-5.156-3.302-1.906-0.748-3.956-1.105-5.981-1.061-2.025 0.040-4.042 0.48-5.885 1.292-1.845 0.809-3.517 1.983-4.898 3.424s-2.474 3.147-3.193 4.994c-0.722 1.846-1.067 3.829-1.023 5.79 0.040 1.961 0.468 3.911 1.254 5.694 0.784 1.784 1.921 3.401 3.316 4.736 1.394 1.336 3.046 2.391 4.832 3.085 1.785 0.697 3.701 1.028 5.598 0.985 1.897-0.040 3.78-0.455 5.502-1.216 1.723-0.759 3.285-1.859 4.574-3.208 1.29-1.348 2.308-2.945 2.977-4.67 0.407-1.046 0.684-2.137 0.829-3.244 0.039 0.002 0.078 0.004 0.118 0.004 1.105 0 2-0.895 2-2 0-0.056-0.003-0.112-0.007-0.167h0.007zM28.822 21.311c-0.733 1.663-1.796 3.169-3.099 4.412s-2.844 2.225-4.508 2.868c-1.663 0.646-3.447 0.952-5.215 0.909-1.769-0.041-3.519-0.429-5.119-1.14-1.602-0.708-3.053-1.734-4.25-2.991s-2.141-2.743-2.76-4.346c-0.621-1.603-0.913-3.319-0.871-5.024 0.041-1.705 0.417-3.388 1.102-4.928 0.683-1.541 1.672-2.937 2.883-4.088s2.642-2.058 4.184-2.652c1.542-0.596 3.192-0.875 4.832-0.833 1.641 0.041 3.257 0.404 4.736 1.064 1.48 0.658 2.82 1.609 3.926 2.774s1.975 2.54 2.543 4.021c0.57 1.481 0.837 3.064 0.794 4.641h0.007c-0.005 0.055-0.007 0.11-0.007 0.167 0 1.032 0.781 1.88 1.784 1.988-0.195 1.088-0.517 2.151-0.962 3.156z"></path>
      </svg>
    </div>
    <b>Deploying</b>
  </div>
`

export default class ServerlessComponent extends HTMLElement {
  constructor(opts) {
    super()

    if (!opts) {
      throw new TypeError('Options not provided')
    }

    const matches = opts.git.match(/^https:\/\/github.com\/([^/]+)\/([^/.]+)(.git)?$/)
    if (!matches) {
      throw new Error("Only Github repositories supported for now")
    }

    const name = `${matches[1]}-${matches[2]}`
    if (matches.length === 3) {
      opts.git += ".git"
    }

    this.url = `${this.getAttribute('endpoint')}/${name}`
    if (opts.path) {
      this.url += "/" + opts.path
    }

    this.isDeployed = false
    fetch(this.url, { method: 'HEAD', redirect: 'error' })
      .then(res => {
        // this.isDeployed = true

        this.initialize()
      })
      .catch(err => {
        // this.isDeployed = false

        if (location.hash === "#deploying") {
          deploying.call(this)
        } else {
          deployable.call(this, {
            git: opts.git,
            endpoint: this.getAttribute('endpoint'),
          })
        }
      })
  }

  initialize() {
    // abstract
  }
}

ServerlessComponent.tmpl = tmpl

function deployable(opts) {
  const node = document.importNode(deployableTemplate.content, true)
  const shadowRoot = this.shadowRoot || this.attachShadow({ mode: 'open' })
  shadowRoot.appendChild(node)
  const a = shadowRoot.querySelector('a')
  a.href = "https://deploy.components.cloud/?repository=" + encodeURIComponent(opts.git) + "&endpoint=" + encodeURIComponent(opts.endpoint)
}

function deploying() {
  const node = document.importNode(deployingTemplate.content, true)
  const shadowRoot = this.shadowRoot || this.attachShadow({ mode: 'open' })
  shadowRoot.appendChild(node)

  const component = this
  function poll() {
    fetch(component.url, { method: 'HEAD', redirect: 'error' })
      .then(() => {
        shadowRoot.innerHTML = ''
        location.hash = ''
        component.initialize()
      })
      .catch(() => {
        setTimeout(poll, 1000)
      })
  }
  setTimeout(poll, 1000)
}